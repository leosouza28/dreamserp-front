import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EndpointsService } from 'src/app/services/endpoints.service';

/** Rascunho de filtros da listagem; novos tipos podem ser acrescentados aqui. */
export interface CrmListFilterDraft {
  tagKeys: Record<string, boolean>;
}

@Component({
  selector: 'app-listar-crm',
  templateUrl: './listar-crm.component.html',
  styleUrls: ['./listar-crm.component.scss']
})
export class ListarCrmComponent implements OnInit {

  data: any = { lista: [], total: 0 };
  form: FormGroup;
  loading: boolean = false;

  filterPanelOpen = false;
  tagOptionsLoading = false;
  /** Tags retornadas pela API (distinct). */
  private crmTagKeysFromApi: string[] = [];

  filterDraft: CrmListFilterDraft = { tagKeys: {} };

  constructor(
    private endpointsService: EndpointsService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      q: this.fb.control(''),
      page: this.fb.control('1'),
      perpage: this.fb.control('10'),
      tags: this.fb.control(''),
    });
  }

  /** Opções de checkbox: tags da API + tags ainda presentes na URL (estado aplicado). */
  get tagCheckboxOptions(): string[] {
    const applied = this.splitTagsParam(this.form.get('tags')?.value);
    return [...new Set([...this.crmTagKeysFromApi, ...applied])].sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );
  }

  ngOnInit(): void {
    this.loadCrmTagOptions();
    this.activatedRoute.queryParams.subscribe(({ ...params }) => {
      if (Object.keys(params).length === 0) this.initializeRoute(true);
      else this.busca(params);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    if (!this.filterPanelOpen) return;
    const target = ev.target as HTMLElement;
    if (target.closest('.crm-filter-anchor')) return;
    this.filterPanelOpen = false;
  }

  private async loadCrmTagOptions(): Promise<void> {
    this.tagOptionsLoading = true;
    try {
      const res = await this.endpointsService.getCrmTagKeys();
      this.crmTagKeysFromApi = Array.isArray(res?.keys) ? res.keys : [];
    } catch (e) {
      console.error('Erro ao carregar tags do CRM', e);
      this.crmTagKeysFromApi = [];
    }
    this.tagOptionsLoading = false;
  }

  initializeRoute(init = false) {
    const q: Record<string, any> = { ...this.form.getRawValue() };
    if (q['page']) q['page'] = Number(q['page']);
    if (q['perpage']) q['perpage'] = Number(q['perpage']);
    if (!q['tags'] || String(q['tags']).trim() === '') delete q['tags'];
    if (init) this.router.navigate([window.location.pathname], { queryParams: q, replaceUrl: true });
    return q;
  }

  query() {
    this.router.navigate([window.location.pathname], {
      queryParams: { ...this.initializeRoute() }
    });
  }

  async busca(q: any) {
    if (this.loading) return;
    this.loading = true;
    try {
      for (let i in q) this.form.get(i)?.setValue(q[i]);
      if (!('tags' in q)) this.form.get('tags')?.setValue('');
      this.data = await this.endpointsService.getCrms(this.form.getRawValue());
    } catch (error) {
      console.error('Erro ao buscar CRMs', error);
    }
    this.loading = false;
  }

  abrirCrm(item: any) {
    this.router.navigate(['/admin/crm/form'], {
      queryParams: { id: item._id },
      state: { crm: item }
    });
  }

  toggleFilterPanel(ev: MouseEvent): void {
    ev.stopPropagation();
    this.filterPanelOpen = !this.filterPanelOpen;
    if (this.filterPanelOpen) this.syncDraftFromApplied();
  }

  private syncDraftFromApplied(): void {
    const applied = new Set(this.splitTagsParam(this.form.get('tags')?.value));
    const next: Record<string, boolean> = {};
    for (const key of this.tagCheckboxOptions) {
      next[key] = applied.has(key);
    }
    this.filterDraft = { ...this.filterDraft, tagKeys: next };
  }

  toggleDraftTag(key: string, checked: boolean): void {
    this.filterDraft.tagKeys = { ...this.filterDraft.tagKeys, [key]: checked };
  }

  isDraftTagSelected(key: string): boolean {
    return !!this.filterDraft.tagKeys[key];
  }

  aplicarFiltros(): void {
    const selected = Object.entries(this.filterDraft.tagKeys)
      .filter(([, on]) => on)
      .map(([k]) => k);
    const raw = this.form.getRawValue();
    const queryParams: Record<string, string | number> = {
      q: raw.q ?? '',
      page: 1,
      perpage: Number(raw.perpage) || 10,
    };
    if (selected.length) queryParams['tags'] = selected.join(',');
    this.router.navigate([window.location.pathname], { queryParams });
    this.filterPanelOpen = false;
  }

  limparFiltros(): void {
    const raw = this.form.getRawValue();
    const cleared: Record<string, boolean> = {};
    for (const key of this.tagCheckboxOptions) cleared[key] = false;
    this.filterDraft = { ...this.filterDraft, tagKeys: cleared };
    this.router.navigate([window.location.pathname], {
      queryParams: {
        q: raw.q ?? '',
        page: 1,
        perpage: Number(raw.perpage) || 10,
      },
    });
    this.filterPanelOpen = false;
  }

  private splitTagsParam(value: unknown): string[] {
    if (value == null || value === '') return [];
    return String(value)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
}
