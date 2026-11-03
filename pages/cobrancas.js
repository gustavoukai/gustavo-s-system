import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';
import TabelaRolavel from '../components/TabelaRolavel';
import { BotaoEditarIcone, BotaoApagarIcone } from '../components/Icones';
import { formatDataCurta, sanitizeValorComCentavos, previewValorComCentavos, parseValorComCentavos } from '../lib/masks';
import {
  CATEGORIA_CLIENTE,
  CATEGORIA_FORNECEDOR,
  PAGAMENTO_STATUS_OPTIONS,
  statusCor,
  formatParcelaLabel,
  calcPercentual,
} from '../lib/cobrancaHelpers';

// Divide o valor do pedido pelo nº de parcelas (só quando há mais de 1 parcela).
// Devolve o texto no formato do campo (ex: "1000,00") ou null.
function valorPorParcelaTexto(pedidoRaw, parcelasRaw) {
  const total = parseValorComCentavos(pedidoRaw);
  const n = Math.max(parseInt(parcelasRaw, 10) || 1, 1);
  if (total == null || n <= 1) return null;
  const base = Math.floor(Math.round(total * 100) / n);
  return (base / 100).toFixed(2).replace('.', ',');
}

const estiloOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  padding: 20,
};

const emptyForm = {
  projetoSelecionadoId: '',
  fornecedorSelecao: '',
  categoria: '',
  parcelas: '1',
  pedido_salvo: '',
  pedido_numero: '',
  pedido_data: '',
  pedido_valor: '',
  pagamento_valor: '',
  pagamento_status: '',
  pagamento_data: '',
  pagamento_previsao: '',
  nf: '',
  nf_numero: '',
  nf_emissao: '',
  nf_envio: '',
  fidelidade_programa: '',
  fidelidade_status: '',
  observacoes: '',
};

export default function Cobrancas() {
  const { loading, canEdit, canDelete } = useAuth();
  const [view, setView] = useState('menu');
  const [projetos, setProjetos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [projetoAtual, setProjetoAtual] = useState(null);
  const [fornecedorAtual, setFornecedorAtual] = useState(null);
  const [cobrancas, setCobrancas] = useState([]);
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formularioAvulso, setFormularioAvulso] = useState(false);
  const [pagamentoAuto, setPagamentoAuto] = useState(false);
  const [escolhaEdicao, setEscolhaEdicao] = useState(null);
  const [editandoTodas, setEditandoTodas] = useState(null);
  const [formTodas, setFormTodas] = useState({});
  const [salvandoTodas, setSalvandoTodas] = useState(false);
  const [erroTodas, setErroTodas] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [destaques, setDestaques] = useState([]);

  async function loadDestaques() {
    const { data } = await supabase
      .from('cobrancas')
      .select(
        '*, projetos(numero_projeto, nome), fornecedores(nome, categorias, vendedor, telefone_vendedor, financeiro, telefone_financeiro)'
      )
      .in('pagamento_status', ['COBRAR', 'NF', 'AGUARDANDO', 'FOLLOW UP', 'INFO']);
    const ordenados = (data || []).sort((a, b) => {
      const dataA = parseDataCurtaParaData(a.pagamento_previsao);
      const dataB = parseDataCurtaParaData(b.pagamento_previsao);
      if (!dataA && !dataB) return 0;
      if (!dataA) return 1;
      if (!dataB) return -1;
      return dataA - dataB;
    });
    setDestaques(ordenados);
  }

  async function loadProjetos() {
    const { data } = await supabase.from('projetos').select('id, numero_projeto, nome');
    const ordenados = (data || []).sort(
      (a, b) => Number(b.numero_projeto || 0) - Number(a.numero_projeto || 0)
    );
    setProjetos(ordenados);
  }

  async function loadFornecedores() {
    const { data } = await supabase
      .from('fornecedores')
      .select('id, nome, categorias, vendedor, telefone_vendedor, financeiro, telefone_financeiro, programas_fidelidade')
      .order('nome');
    setFornecedores(data || []);
  }

  useEffect(() => {
    if (!loading) {
      loadProjetos();
      loadFornecedores();
      loadDestaques();
    }
  }, [loading]);

  async function loadCobrancasPorProjeto(projetoId) {
    const { data } = await supabase
      .from('cobrancas')
      .select('*, fornecedores(nome, categorias, vendedor, telefone_vendedor, financeiro, telefone_financeiro)')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: true });
    setCobrancas(data || []);
  }

  async function loadCobrancasPorFornecedor(fornecedorId) {
    const { data } = await supabase
      .from('cobrancas')
      .select('*, projetos(numero_projeto, nome)')
      .eq('fornecedor_id', fornecedorId)
      .order('created_at', { ascending: true });
    const ordenadas = (data || []).sort((a, b) => {
      const dataA = parseDataCurtaParaData(a.pagamento_previsao);
      const dataB = parseDataCurtaParaData(b.pagamento_previsao);
      if (!dataA && !dataB) return 0;
      if (!dataA) return 1;
      if (!dataB) return -1;
      return dataA - dataB;
    });
    setCobrancas(ordenadas);
  }

  function somarMesesData(dataStr, meses) {
    if (!dataStr) return dataStr;
    const partes = dataStr.split('/');
    if (partes.length !== 3) return dataStr;

    const dia = parseInt(partes[0], 10);
    let mes = parseInt(partes[1], 10);
    let ano = parseInt(partes[2], 10);
    ano = ano < 100 ? 2000 + ano : ano;

    mes += meses;
    while (mes > 12) {
      mes -= 12;
      ano += 1;
    }
    while (mes < 1) {
      mes += 12;
      ano -= 1;
    }

    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${String(ano).slice(-2)}`;
  }

  function parseDataCurtaParaData(str) {
    if (!str) return null;
    const partes = str.split('/');
    if (partes.length !== 3) return null;
    const [d, m, a] = partes;
    const ano = Number(a) < 100 ? 2000 + Number(a) : Number(a);
    const data = new Date(ano, Number(m) - 1, Number(d));
    return isNaN(data.getTime()) ? null : data;
  }

  async function loadCobrancasPorPeriodo(inicio, fim) {
    if (!inicio || !fim) {
      setCobrancas([]);
      return;
    }
    const { data } = await supabase
      .from('cobrancas')
      .select(
        '*, projetos(numero_projeto, nome), fornecedores(nome, categorias, vendedor, telefone_vendedor, financeiro, telefone_financeiro)'
      )
      .not('pagamento_previsao', 'is', null);

    const dataInicio = new Date(inicio + 'T00:00:00');
    const dataFim = new Date(fim + 'T23:59:59');

    const filtradas = (data || []).filter((item) => {
      const previsao = parseDataCurtaParaData(item.pagamento_previsao);
      return previsao && previsao >= dataInicio && previsao <= dataFim;
    });

    filtradas.sort((a, b) => parseDataCurtaParaData(a.pagamento_previsao) - parseDataCurtaParaData(b.pagamento_previsao));
    setCobrancas(filtradas);
  }

  function abrirProjeto(projeto) {
    setProjetoAtual(projeto);
    setView('projeto');
    loadCobrancasPorProjeto(projeto.id);
  }

  function abrirFornecedor(fornecedor) {
    setFornecedorAtual(fornecedor);
    setView('fornecedor');
    loadCobrancasPorFornecedor(fornecedor.id);
  }

  function voltarParaMenu() {
    setView('menu');
    setProjetoAtual(null);
    setFornecedorAtual(null);
    setCobrancas([]);
    handleCancelar();
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFornecedorSelecaoChange(valor) {
    if (valor === 'Cliente') {
      setForm((prev) => ({ ...prev, fornecedorSelecao: 'Cliente', categoria: '', fidelidade_programa: '' }));
      return;
    }
    const fornecedor = fornecedores.find((f) => f.id === valor);
    setForm((prev) => ({
      ...prev,
      fornecedorSelecao: valor,
      categoria: '',
      fidelidade_programa: (fornecedor?.programas_fidelidade || []).join(', '),
    }));
  }

  function updateFieldComDivisao(field, value) {
    const novo = { ...form, [field]: value };
    if (!editingId) {
      const calculado = valorPorParcelaTexto(novo.pedido_valor, novo.parcelas);
      if (calculado && (!form.pagamento_valor || pagamentoAuto)) {
        novo.pagamento_valor = calculado;
        setPagamentoAuto(true);
      } else if (!calculado && pagamentoAuto) {
        novo.pagamento_valor = '';
        setPagamentoAuto(false);
      }
    }
    setForm(novo);
  }

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setPagamentoAuto(false);
    setError('');
    setFormularioAvulso(false);
    setShowForm(true);
  }

  function abrirNovaCobrancaAvulsa() {
    setEditingId(null);
    setForm(emptyForm);
    setPagamentoAuto(false);
    setError('');
    setFormularioAvulso(true);
    setShowForm(true);
  }

  function openEditForm(item) {
    setForm({
      projetoSelecionadoId: item.projeto_id || '',
      fornecedorSelecao: item.fornecedor_tipo === 'cliente' ? 'Cliente' : item.fornecedor_id,
      categoria: item.categoria || '',
      parcelas: String(item.parcela_total || 1),
      pedido_salvo: item.pedido_salvo || '',
      pedido_numero: item.pedido_numero || '',
      pedido_data: item.pedido_data || '',
      pedido_valor: item.pedido_valor != null ? String(item.pedido_valor).replace('.', ',') : '',
      pagamento_valor: item.pagamento_valor != null ? String(item.pagamento_valor).replace('.', ',') : '',
      pagamento_status: item.pagamento_status || '',
      pagamento_data: item.pagamento_data || '',
      pagamento_previsao: item.pagamento_previsao || '',
      nf: item.nf || '',
      nf_numero: item.nf_numero || '',
      nf_emissao: item.nf_emissao || '',
      nf_envio: item.nf_envio || '',
      fidelidade_programa: item.fidelidade_programa || '',
      fidelidade_status: item.fidelidade_status || '',
      observacoes: item.observacoes || '',
    });
    setEditingId(item.id);
    setError('');
    setFormularioAvulso(false);
    setShowForm(true);
  }

  function handleCancelar() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setPagamentoAuto(false);
    setError('');
    setFormularioAvulso(false);
  }

  function handleLimpar() {
    if (!confirm('Tem certeza que quer limpar todas as informações inseridas?')) return;
    setForm(emptyForm);
    setPagamentoAuto(false);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !form.fornecedorSelecao ||
      !form.categoria ||
      !form.pagamento_status ||
      (formularioAvulso && !form.projetoSelecionadoId)
    ) {
      setError(
        'Preencha os campos obrigatórios antes de salvar: Projeto (se estiver cadastrando avulso), Cliente/Fornecedor, Categoria e Status do Pagamento.'
      );
      return;
    }

    setSaving(true);
    setError('');

    const tipo = form.fornecedorSelecao === 'Cliente' ? 'cliente' : 'fornecedor';
    const fornecedorId = tipo === 'fornecedor' ? form.fornecedorSelecao : null;

    if (!editingId) {
      const valorChecagem = form.pagamento_valor
        ? parseValorComCentavos(form.pagamento_valor)
        : form.pedido_valor
        ? parseValorComCentavos(form.pedido_valor)
        : null;
      const projetoChecagem = formularioAvulso ? form.projetoSelecionadoId : projetoAtual?.id;

      if (valorChecagem != null && projetoChecagem) {
        const fornecedorFiltro = fornecedorId ? `fornecedor_id.eq.${fornecedorId}` : 'fornecedor_id.is.null';
        const { data: cobrancasComValor } = await supabase
          .from('cobrancas')
          .select('id, pagamento_valor, pedido_valor')
          .eq('projeto_id', projetoChecagem)
          .eq('fornecedor_tipo', tipo)
          .eq('categoria', form.categoria)
          .or(fornecedorFiltro);

        const temDuplicado = (cobrancasComValor || []).some(
          (c) => c.pagamento_valor === valorChecagem || c.pedido_valor === valorChecagem
        );

        if (temDuplicado) {
          if (
            !confirm(
              'Já existe uma cobrança cadastrada neste projeto com o mesmo fornecedor/cliente, categoria e valor. Deseja cadastrar mesmo assim?'
            )
          ) {
            setSaving(false);
            return;
          }
        }
      }
    }

    const basePayload = {
      fornecedor_tipo: tipo,
      fornecedor_id: fornecedorId,
      categoria: form.categoria,
      pedido_salvo: form.pedido_salvo || null,
      pedido_numero: form.pedido_numero || null,
      pedido_data: form.pedido_data || null,
      pedido_valor: form.pedido_valor ? parseValorComCentavos(form.pedido_valor) : null,
      pagamento_valor: form.pagamento_valor ? parseValorComCentavos(form.pagamento_valor) : null,
      pagamento_status: form.pagamento_status || null,
      pagamento_data: form.pagamento_data || null,
      pagamento_previsao: form.pagamento_previsao || null,
      nf: form.nf || null,
      nf_numero: form.nf_numero || null,
      nf_emissao: form.nf_emissao || null,
      nf_envio: form.nf_envio || null,
      fidelidade_programa: form.fidelidade_programa || null,
      fidelidade_status: form.fidelidade_status || null,
      observacoes: form.observacoes || null,
      atualizado_em: new Date().toISOString(),
    };

    let idsParaSincronizar = [];

    if (editingId) {
      const { error: updateError } = await supabase.from('cobrancas').update(basePayload).eq('id', editingId);
      if (updateError) {
        setSaving(false);
        setError(`Não foi possível salvar: ${updateError.message}`);
        return;
      }
      idsParaSincronizar = [editingId];
    } else {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const totalParcelas = Math.max(parseInt(form.parcelas, 10) || 1, 1);
      const percentual = calcPercentual(totalParcelas);
      const registros = [];
      // Se o valor do pagamento foi calculado automaticamente (pedido ÷ parcelas), distribui
      // os centavos que sobrarem na última parcela, pra a soma bater certinho com o pedido.
      const totalCentavos =
        pagamentoAuto && form.pedido_valor && totalParcelas > 1
          ? Math.round(parseValorComCentavos(form.pedido_valor) * 100)
          : null;
      const grupoId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null;

      for (let i = 1; i <= totalParcelas; i++) {
        const valorDaParcela =
          totalCentavos != null
            ? (Math.floor(totalCentavos / totalParcelas) + (i === totalParcelas ? totalCentavos % totalParcelas : 0)) / 100
            : basePayload.pagamento_valor;
        registros.push({
          ...basePayload,
          pagamento_valor: valorDaParcela,
          grupo_id: totalParcelas > 1 ? grupoId : null,
          projeto_id: formularioAvulso ? form.projetoSelecionadoId : projetoAtual.id,
          parcela_atual: i,
          parcela_total: totalParcelas,
          percentual,
          pagamento_previsao: somarMesesData(basePayload.pagamento_previsao, i - 1),
          created_by: session?.user?.id || null,
        });
      }

      const { data: inseridos, error: insertError } = await supabase.from('cobrancas').insert(registros).select('id');
      if (insertError) {
        setSaving(false);
        setError(`Não foi possível salvar: ${insertError.message}`);
        return;
      }
      idsParaSincronizar = (inseridos || []).map((r) => r.id);
    }

    try {
      const { data: linhasCompletas } = await supabase
        .from('cobrancas')
        .select('*')
        .in('id', idsParaSincronizar);
      for (const linha of linhasCompletas || []) {
        await sincronizarRecebimento(linha);
      }
    } catch (syncError) {
      // A sincronização com Recebimentos não deve travar o cadastro principal.
    }

    setSaving(false);
    handleCancelar();
    recarregarListaAtual();
  }

  // Gera a planilha Excel (.xlsx) com as cobranças que estão visíveis na tela.
  async function baixarPlanilha(lista) {
    const modulo = await import('xlsx');
    const XLSX = modulo.default && modulo.default.utils ? modulo.default : modulo;

    function nomeProjeto(item) {
      if (item.projetos) return `${item.projetos.numero_projeto} - ${item.projetos.nome}`;
      if (view === 'projeto' && projetoAtual) return `${projetoAtual.numero_projeto} - ${projetoAtual.nome}`;
      return '';
    }
    function nomeFornecedor(item) {
      if (item.fornecedor_tipo === 'cliente') return 'Cliente';
      if (item.fornecedores?.nome) return item.fornecedores.nome;
      if (view === 'fornecedor' && fornecedorAtual) return fornecedorAtual.nome;
      return '';
    }
    function serialExcel(dataTexto) {
      const d = parseDataCurtaParaData(dataTexto);
      if (!d) return null;
      return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 86400000);
    }

    const linhas = [['Projeto', 'Cliente / Fornecedor', 'Categoria', 'Parcela', 'Valor', 'Previsão']];
    lista.forEach((item) => {
      linhas.push([
        nomeProjeto(item),
        nomeFornecedor(item),
        item.categoria || '',
        item.parcela_total ? formatParcelaLabel(item.parcela_atual, item.parcela_total) : '',
        item.pagamento_valor != null ? Number(item.pagamento_valor) : null,
        serialExcel(item.pagamento_previsao),
      ]);
    });

    const planilha = XLSX.utils.aoa_to_sheet(linhas);
    for (let r = 1; r < linhas.length; r++) {
      const celulaValor = planilha[XLSX.utils.encode_cell({ r, c: 4 })];
      if (celulaValor) celulaValor.z = '"R$" #,##0.00';
      const celulaData = planilha[XLSX.utils.encode_cell({ r, c: 5 })];
      if (celulaData) celulaData.z = 'dd/mm/yy';
    }
    planilha['!cols'] = [{ wch: 34 }, { wch: 28 }, { wch: 14 }, { wch: 9 }, { wch: 16 }, { wch: 12 }];

    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, 'Cobranças');
    const bytes = XLSX.write(livro, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cobrancas-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Atualiza a lista que está na tela (menu, projeto, fornecedor ou período).
  function recarregarListaAtual() {
    if (view === 'projeto' && projetoAtual) loadCobrancasPorProjeto(projetoAtual.id);
    else if (view === 'fornecedor' && fornecedorAtual) loadCobrancasPorFornecedor(fornecedorAtual.id);
    else if (view === 'periodo') loadCobrancasPorPeriodo(periodoInicio, periodoFim);
    loadDestaques();
  }

  // ---- Edição de cobranças parceladas: "só esta parcela" ou "cobrança inteira" ----
  function iniciarEdicao(item) {
    if (item.parcela_total > 1 && item.grupo_id) setEscolhaEdicao(item);
    else openEditForm(item);
  }

  function escolherSomenteParcela() {
    const item = escolhaEdicao;
    setEscolhaEdicao(null);
    openEditForm(item);
  }

  function escolherCobrancaInteira() {
    const it = escolhaEdicao;
    setEscolhaEdicao(null);
    setFormTodas({
      categoria: it.categoria || '',
      pedido_salvo: it.pedido_salvo || '',
      pedido_numero: it.pedido_numero || '',
      pedido_data: it.pedido_data || '',
      pedido_valor: it.pedido_valor != null ? String(it.pedido_valor).replace('.', ',') : '',
      fidelidade_programa: it.fidelidade_programa || '',
      fidelidade_status: it.fidelidade_status || '',
      observacoes: it.observacoes || '',
      recalcular: false,
    });
    setErroTodas('');
    setEditandoTodas(it);
  }

  function updateTodas(field, value) {
    setFormTodas((prev) => ({ ...prev, [field]: value }));
  }

  async function salvarTodas(e) {
    e.preventDefault();
    if (!formTodas.categoria) {
      setErroTodas('Escolha a Categoria.');
      return;
    }
    setSalvandoTodas(true);
    setErroTodas('');

    const base = editandoTodas;
    const pedidoNumero = formTodas.pedido_valor ? parseValorComCentavos(formTodas.pedido_valor) : null;

    const { error: updateError } = await supabase
      .from('cobrancas')
      .update({
        categoria: formTodas.categoria,
        pedido_salvo: formTodas.pedido_salvo || null,
        pedido_numero: formTodas.pedido_numero || null,
        pedido_data: formTodas.pedido_data || null,
        pedido_valor: pedidoNumero,
        fidelidade_programa: formTodas.fidelidade_programa || null,
        fidelidade_status: formTodas.fidelidade_status || null,
        observacoes: formTodas.observacoes || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('grupo_id', base.grupo_id);

    if (updateError) {
      setSalvandoTodas(false);
      setErroTodas(`Não foi possível salvar: ${updateError.message}`);
      return;
    }

    // Recalcula o valor de cada parcela ainda não paga (pedido ÷ nº de parcelas).
    if (formTodas.recalcular && pedidoNumero != null) {
      const { data: parcelas } = await supabase
        .from('cobrancas')
        .select('id, parcela_atual, pagamento_status')
        .eq('grupo_id', base.grupo_id);
      const n = base.parcela_total;
      const totalCentavos = Math.round(pedidoNumero * 100);
      for (const parcela of parcelas || []) {
        if (parcela.pagamento_status === 'PAGO') continue;
        const valor = (Math.floor(totalCentavos / n) + (parcela.parcela_atual === n ? totalCentavos % n : 0)) / 100;
        await supabase.from('cobrancas').update({ pagamento_valor: valor }).eq('id', parcela.id);
      }
    }

    // Mantém os Recebimentos em dia (a categoria aparece lá também).
    try {
      const { data: atualizadas } = await supabase.from('cobrancas').select('*').eq('grupo_id', base.grupo_id);
      for (const linha of atualizadas || []) {
        await sincronizarRecebimento(linha);
      }
    } catch (syncError) {
      // não trava a edição
    }

    setSalvandoTodas(false);
    setEditandoTodas(null);
    recarregarListaAtual();
  }


  // Sempre que uma cobrança é salva com status "PAGO" + valor + data preenchidos,
  // cria (ou atualiza) o recebimento correspondente. Se deixar de atender a condição,
  // o recebimento automático é removido.
  async function sincronizarRecebimento(cobranca) {
    const condicaoAtendida =
      cobranca.pagamento_status === 'PAGO' && cobranca.pagamento_valor != null && !!cobranca.pagamento_data;

    if (!condicaoAtendida) {
      await supabase.from('recebimentos').delete().eq('cobranca_id', cobranca.id);
      return;
    }

    const partesData = (cobranca.pagamento_data || '').split('/');
    if (partesData.length !== 3) return;
    const anoCurto = parseInt(partesData[2], 10);
    const ano = anoCurto < 100 ? 2000 + anoCurto : anoCurto;
    const mes = parseInt(partesData[1], 10);
    if (!ano || !mes) return;

    const { data: existente } = await supabase
      .from('recebimentos')
      .select('id')
      .eq('cobranca_id', cobranca.id)
      .maybeSingle();

    const payload = {
      cobranca_id: cobranca.id,
      ano,
      mes,
      data: cobranca.pagamento_data,
      projeto_id: cobranca.projeto_id,
      fornecedor_tipo: cobranca.fornecedor_tipo,
      fornecedor_id: cobranca.fornecedor_id,
      categoria: cobranca.categoria,
      parcela_atual: cobranca.parcela_atual,
      parcela_total: cobranca.parcela_total,
      percentual: cobranca.percentual,
      valor: cobranca.pagamento_valor,
      nf_numero: cobranca.nf_numero,
      atualizado_em: new Date().toISOString(),
    };

    if (existente) {
      await supabase.from('recebimentos').update(payload).eq('id', existente.id);
    } else {
      await supabase.from('recebimentos').insert([payload]);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Apagar esta cobrança?')) return;
    await supabase.from('cobrancas').delete().eq('id', id);
    if (view === 'projeto') loadCobrancasPorProjeto(projetoAtual.id);
    if (view === 'fornecedor') loadCobrancasPorFornecedor(fornecedorAtual.id);
    if (view === 'menu') loadDestaques();
    if (view === 'periodo') loadCobrancasPorPeriodo(periodoInicio, periodoFim);
  }

  const categoriaOpcoes =
    form.fornecedorSelecao === 'Cliente' ? CATEGORIA_CLIENTE : CATEGORIA_FORNECEDOR;

  function AlertaTriangulo({ title }) {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" title={title} style={{ flexShrink: 0, verticalAlign: 'middle' }}>
        <polygon points="10,2 18.5,17 1.5,17" fill="#e8b93a" />
        <text x="10" y="15.5" fontSize="10" fontWeight="700" fill="#4a3a06" textAnchor="middle">
          !
        </text>
      </svg>
    );
  }

  function LegendaStatusPagamento() {
    return (
      <div className="section-card">
        <h2 style={{ marginBottom: 10 }}>Legenda de status do Pagamento</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {PAGAMENTO_STATUS_OPTIONS.map((s) => {
            const cor = statusCor(s.codigo);
            return (
              <span
                key={s.codigo}
                style={{
                  backgroundColor: cor.backgroundColor,
                  color: cor.color,
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <strong>{s.codigo}</strong> — {s.texto}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  function CobrancaBox({ item, mostrarFornecedorInfo }) {
    const style = statusCor(item.pagamento_status);
    const statusInfo = PAGAMENTO_STATUS_OPTIONS.find((s) => s.codigo === item.pagamento_status);
    const ehClienteAssessoria = item.fornecedor_tipo === 'cliente' && item.categoria === 'Assessoria';
    const nfIncompleta = item.nf === 'sim' && !item.nf_numero && !item.nf_emissao;

    return (
      <div className="cobranca-box" style={{ backgroundColor: style.backgroundColor, color: style.color }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            {mostrarFornecedorInfo && (
              <h3 style={{ fontSize: 19, margin: 0 }}>
                {item.fornecedor_tipo === 'cliente' ? 'Cliente' : item.fornecedores?.nome || '(fornecedor)'}
                {(view === 'fornecedor' || view === 'periodo' || view === 'menu') && item.projetos && (
                  <> – Projeto: {item.projetos.numero_projeto} - {item.projetos.nome}</>
                )}
              </h3>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {item.pagamento_previsao && (
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
                Pagamento previsão: {item.pagamento_previsao}
              </p>
            )}
            {canEdit && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <BotaoEditarIcone onClick={() => iniciarEdicao(item)} />
                {canDelete && <BotaoApagarIcone onClick={() => handleDelete(item.id)} />}
              </div>
            )}
          </div>
        </div>

        {mostrarFornecedorInfo && item.fornecedor_tipo === 'fornecedor' && item.fornecedores && (
          <p style={{ margin: '2px 0', fontSize: 12 }}>
            {(item.fornecedores.categorias || []).join(', ')}
            {item.fornecedores.vendedor ? ` · Vendedor: ${item.fornecedores.vendedor}` : ''}
            {item.fornecedores.telefone_vendedor ? ` (${item.fornecedores.telefone_vendedor})` : ''}
            {item.fornecedores.financeiro ? ` · Financeiro: ${item.fornecedores.financeiro}` : ''}
            {item.fornecedores.telefone_financeiro ? ` (${item.fornecedores.telefone_financeiro})` : ''}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>
            Categoria: {item.categoria} — Parcela {formatParcelaLabel(item.parcela_atual, item.parcela_total)}
            {item.percentual != null ? ` (${item.percentual}%)` : ''}
          </p>
          {item.pagamento_status && (
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              Pagamento status: {item.pagamento_status}
              {statusInfo && (
                <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 8 }}>— {statusInfo.texto}</span>
              )}
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '4px 16px', marginTop: 8, fontSize: 13 }}>
          {!ehClienteAssessoria && <div><strong>Pedido salvo:</strong> {item.pedido_salvo || '—'}</div>}
          {!ehClienteAssessoria && <div><strong>Pedido nº:</strong> {item.pedido_numero || '—'}</div>}
          {!ehClienteAssessoria && <div><strong>Pedido data:</strong> {item.pedido_data || '—'}</div>}
          <div><strong>Pedido valor:</strong> {item.pedido_valor != null ? `R$ ${Number(item.pedido_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</div>
          <div><strong>Pagamento valor:</strong> {item.pagamento_valor != null ? `R$ ${Number(item.pagamento_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</div>
          <div><strong>Pagamento data:</strong> {item.pagamento_data || '—'}</div>
          <div>
            <strong>NF:</strong> {item.nf || '—'} {nfIncompleta && <AlertaTriangulo title="NF marcada como Sim, mas número e emissão ainda não foram preenchidos" />}
          </div>
          <div><strong>NF nº:</strong> {item.nf_numero || '—'}</div>
          <div><strong>NF emissão:</strong> {item.nf_emissao || '—'}</div>
          <div><strong>NF envio:</strong> {item.nf_envio || '—'}</div>
          {!ehClienteAssessoria && (
            <div>
              <strong>Fidelidade:</strong> {item.fidelidade_programa || '—'} {item.fidelidade_status ? `(${item.fidelidade_status})` : ''}
              {item.fidelidade_status === 'Lançar' && <AlertaTriangulo title="Programa de fidelidade ainda não lançado" />}
              {item.fidelidade_status === 'Creditado' && ' ✅'}
            </div>
          )}
        </div>
        {item.observacoes && (
          <p style={{ marginTop: 8, fontSize: 13 }}>
            <strong>Observações:</strong> {item.observacoes}
          </p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-center">
        <p className="loading-text">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="wide-page">
      <div className="wide-page-inner">
        <Nav />

        {view === 'menu' && (
          <>
            <h1 style={{ marginBottom: 18 }}>Cobranças</h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button style={{ width: 'auto', padding: '14px 24px' }} onClick={() => setView('projetos')}>
                Ver por Projeto
              </button>
              <button
                style={{ width: 'auto', padding: '14px 24px', background: 'var(--primary-dark)' }}
                onClick={() => setView('fornecedores')}
              >
                Ver por Fornecedor
              </button>
              <button
                style={{ width: 'auto', padding: '14px 24px', background: 'var(--accent)' }}
                onClick={() => setView('periodo')}
              >
                Ver por Período
              </button>
            </div>

            <LegendaStatusPagamento />

            {canEdit && !showForm && (
              <button
                type="button"
                onClick={abrirNovaCobrancaAvulsa}
                style={{ width: 'auto', padding: '10px 18px', margin: '20px 0' }}
              >
                + Nova cobrança
              </button>
            )}

            {!showForm && destaques.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h2 style={{ marginBottom: 12 }}>Cobranças em aberto (Cobrar / NF / Aguardando / Follow Up / Info)</h2>
                {destaques.length > 0 && !showForm && (
              <button
                type="button"
                className="btn-secondary"
                style={{ marginBottom: 14 }}
                onClick={() => baixarPlanilha(destaques)}
              >
                ⬇ Baixar planilha (Excel)
              </button>
            )}

                {destaques.map((item) => (
                  <CobrancaBox key={item.id} item={item} mostrarFornecedorInfo />
                ))}
              </div>
            )}
          </>
        )}

        {view === 'projetos' && (
          <>
            <div className="toolbar">
              <h1>Cobranças por Projeto</h1>
              <button className="btn-secondary" onClick={voltarParaMenu}>
                Voltar
              </button>
            </div>

            <TabelaRolavel>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Nome do projeto</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((p) => (
                    <tr key={p.id}>
                      <td>{p.numero_projeto}</td>
                      <td>{p.nome}</td>
                      <td>
                        <button className="btn-editar" onClick={() => abrirProjeto(p)}>
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabelaRolavel>
          </>
        )}

        {view === 'fornecedores' && (
          <>
            <div className="toolbar">
              <h1>Cobranças por Fornecedor</h1>
              <button className="btn-secondary" onClick={voltarParaMenu}>
                Voltar
              </button>
            </div>

            <TabelaRolavel>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fornecedor</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fornecedores.map((f) => (
                    <tr key={f.id}>
                      <td>{f.nome}</td>
                      <td>
                        <button className="btn-editar" onClick={() => abrirFornecedor(f)}>
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabelaRolavel>
          </>
        )}

        {view === 'projeto' && projetoAtual && (
          <>
            <div className="toolbar">
              <h1>
                {projetoAtual.numero_projeto} - {projetoAtual.nome}
              </h1>
              <button className="btn-secondary" onClick={() => setView('projetos')}>
                Voltar
              </button>
            </div>

            {!showForm && <LegendaStatusPagamento />}

            {canEdit && !showForm && (
              <button
                type="button"
                onClick={openNewForm}
                style={{ width: 'auto', padding: '10px 18px', marginBottom: 20 }}
              >
                + Nova cobrança
              </button>
            )}
          </>
        )}

        {canEdit && showForm && (view === 'projeto' || view === 'menu' || view === 'fornecedor' || view === 'periodo') && (
              <form
                className="section-card"
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                style={{ marginBottom: 24 }}
              >
                <div className="toolbar" style={{ marginBottom: 4 }}>
                  <h2>{editingId ? 'Editar cobrança' : 'Nova cobrança'}</h2>
                  <button type="button" className="btn-secondary" onClick={handleCancelar}>
                    Cancelar
                  </button>
                </div>

                {error && <div className="error-box">{error}</div>}

                <div className="form-grid">
                  {formularioAvulso && (
                    <div>
                      <label>
                        Projeto <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>(campo obrigatório)</span>
                      </label>
                      <select
                        value={form.projetoSelecionadoId}
                        onChange={(e) => updateField('projetoSelecionadoId', e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {projetos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.numero_projeto} - {p.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label>
                      Cliente / Fornecedor <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>(campo obrigatório)</span>
                    </label>
                    <select
                      value={form.fornecedorSelecao}
                      onChange={(e) => handleFornecedorSelecaoChange(e.target.value)}
                      disabled={!!editingId}
                    >
                      <option value="">Selecione...</option>
                      <option value="Cliente">Cliente</option>
                      {fornecedores.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.fornecedorSelecao && (
                    <div>
                      <label>
                        Categoria <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>(campo obrigatório)</span>
                      </label>
                      <select value={form.categoria} onChange={(e) => updateField('categoria', e.target.value)}>
                        <option value="">Selecione...</option>
                        {categoriaOpcoes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!editingId && (
                    <div>
                      <label>Parcela (quantidade)</label>
                      <input
                        value={form.parcelas}
                        onChange={(e) => updateFieldComDivisao('parcelas', e.target.value.replace(/\D/g, '').slice(0, 2))}
                        placeholder="Ex: 3"
                        inputMode="numeric"
                      />
                    </div>
                  )}

                  {!editingId && form.parcelas && (
                    <div>
                      <label>%</label>
                      <input value={`${calcPercentual(parseInt(form.parcelas, 10) || 1)}%`} disabled />
                    </div>
                  )}
                </div>

                <div className="form-section-title">Pedido</div>
                <div className="form-grid">
                  <div>
                    <label>Pedido salvo</label>
                    <select value={form.pedido_salvo} onChange={(e) => updateField('pedido_salvo', e.target.value)}>
                      <option value="">—</option>
                      <option value="sim">Sim</option>
                      <option value="não">Não</option>
                    </select>
                  </div>
                  <div>
                    <label>Número</label>
                    <input value={form.pedido_numero} onChange={(e) => updateField('pedido_numero', e.target.value)} />
                  </div>
                  <div>
                    <label>Data</label>
                    <input
                      value={form.pedido_data}
                      onChange={(e) => updateField('pedido_data', formatDataCurta(e.target.value))}
                      placeholder="DD/MM/AA"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label>Valor</label>
                    <input
                      value={form.pedido_valor}
                      onChange={(e) => updateFieldComDivisao('pedido_valor', sanitizeValorComCentavos(e.target.value))}
                      placeholder="1500 ou 1500,50"
                      inputMode="decimal"
                    />
                    {form.pedido_valor && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -12, marginBottom: 18 }}>
                        = {previewValorComCentavos(form.pedido_valor)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="form-section-title">Pagamento</div>
                <div className="form-grid">
                  <div>
                    <label>Valor</label>
                    <input
                      value={form.pagamento_valor}
                      onChange={(e) => {
                        setPagamentoAuto(false);
                        updateField('pagamento_valor', sanitizeValorComCentavos(e.target.value));
                      }}
                      placeholder="1500 ou 1500,50"
                      inputMode="decimal"
                    />
                    {form.pagamento_valor && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -12, marginBottom: 18 }}>
                        = {previewValorComCentavos(form.pagamento_valor)}
                      </p>
                    )}
                    {pagamentoAuto && (
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: -12, marginBottom: 18 }}>
                        Calculado automaticamente: valor do pedido ÷ nº de parcelas (você pode alterar).
                      </p>
                    )}
                  </div>
                  <div>
                    <label>
                      Status <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>(campo obrigatório)</span>
                    </label>
                    <select
                      value={form.pagamento_status}
                      onChange={(e) => updateField('pagamento_status', e.target.value)}
                      style={form.pagamento_status ? statusCor(form.pagamento_status) : {}}
                    >
                      <option value="">Selecione...</option>
                      {PAGAMENTO_STATUS_OPTIONS.map((s) => (
                        <option key={s.codigo} value={s.codigo}>
                          {s.codigo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Data</label>
                    <input
                      value={form.pagamento_data}
                      onChange={(e) => updateField('pagamento_data', formatDataCurta(e.target.value))}
                      placeholder="DD/MM/AA"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label>Previsão</label>
                    <input
                      value={form.pagamento_previsao}
                      onChange={(e) => updateField('pagamento_previsao', formatDataCurta(e.target.value))}
                      placeholder="DD/MM/AA"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="form-section-title">Nota Fiscal</div>
                <div className="form-grid">
                  <div>
                    <label>NF</label>
                    <select value={form.nf} onChange={(e) => updateField('nf', e.target.value)}>
                      <option value="">—</option>
                      <option value="sim">Sim</option>
                      <option value="não">Não</option>
                    </select>
                  </div>
                  <div>
                    <label>Número</label>
                    <input
                      value={form.nf_numero}
                      onChange={(e) => updateField('nf_numero', e.target.value)}
                      className={form.nf === 'sim' && !form.nf_numero ? 'field-highlight-red' : ''}
                    />
                  </div>
                  <div>
                    <label>Emissão</label>
                    <input
                      value={form.nf_emissao}
                      onChange={(e) => updateField('nf_emissao', formatDataCurta(e.target.value))}
                      placeholder="DD/MM/AA"
                      inputMode="numeric"
                      className={form.nf === 'sim' && !form.nf_emissao ? 'field-highlight-red' : ''}
                    />
                  </div>
                  <div>
                    <label>Envio</label>
                    <input
                      value={form.nf_envio}
                      onChange={(e) => updateField('nf_envio', formatDataCurta(e.target.value))}
                      placeholder="DD/MM/AA"
                      inputMode="numeric"
                      className={form.nf === 'sim' && !form.nf_envio ? 'field-highlight-red' : ''}
                    />
                  </div>
                </div>

                <div className="form-section-title">Programa de Fidelidade</div>
                <div className="form-grid">
                  <div>
                    <label>Programa</label>
                    <input
                      value={form.fidelidade_programa}
                      onChange={(e) => updateField('fidelidade_programa', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Status</label>
                    <select
                      value={form.fidelidade_status}
                      onChange={(e) => updateField('fidelidade_status', e.target.value)}
                      className={form.fidelidade_status === 'Lançar' ? 'field-highlight-amber' : ''}
                    >
                      <option value="">—</option>
                      <option value="Lançar">Lançar</option>
                      <option value="Creditado">Creditado ✅</option>
                    </select>
                  </div>
                </div>

                <div className="form-section-title">Observações</div>
                <div className="form-grid">
                  <div style={{ gridColumn: '1 / -1' }}>
                    <input value={form.observacoes} onChange={(e) => updateField('observacoes', e.target.value)} />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLimpar}
                    style={{ marginLeft: 24, background: 'var(--danger)', color: 'white' }}
                  >
                    LIMPAR
                  </button>
                </div>
              </form>
            )}

        {view === 'projeto' && projetoAtual && !showForm && (
          <div>
            {cobrancas.length > 0 && !showForm && (
              <button
                type="button"
                className="btn-secondary"
                style={{ marginBottom: 14 }}
                onClick={() => baixarPlanilha(cobrancas)}
              >
                ⬇ Baixar planilha (Excel)
              </button>
            )}

            {cobrancas.length === 0 ? (
              <p className="empty-hint">Nenhuma cobrança cadastrada neste projeto.</p>
            ) : (
              cobrancas.map((item) => <CobrancaBox key={item.id} item={item} mostrarFornecedorInfo />)
            )}
          </div>
        )}

        {view === 'fornecedor' && fornecedorAtual && (
          <>
            <div className="toolbar">
              <h1>{fornecedorAtual.nome}</h1>
              <button className="btn-secondary" onClick={() => setView('fornecedores')}>
                Voltar
              </button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 18 }}>
              {fornecedorAtual.vendedor ? `Vendedor: ${fornecedorAtual.vendedor}` : ''}
              {fornecedorAtual.telefone_vendedor ? ` (${fornecedorAtual.telefone_vendedor})` : ''}
              {fornecedorAtual.financeiro ? ` · Financeiro: ${fornecedorAtual.financeiro}` : ''}
              {fornecedorAtual.telefone_financeiro ? ` (${fornecedorAtual.telefone_financeiro})` : ''}
            </p>

            <LegendaStatusPagamento />

            {cobrancas.length > 0 && !showForm && (
              <button
                type="button"
                className="btn-secondary"
                style={{ marginBottom: 14 }}
                onClick={() => baixarPlanilha(cobrancas)}
              >
                ⬇ Baixar planilha (Excel)
              </button>
            )}

            {showForm ? null : cobrancas.length === 0 ? (
              <p className="empty-hint">Nenhuma cobrança cadastrada com este fornecedor.</p>
            ) : (
              cobrancas.map((item) => <CobrancaBox key={item.id} item={item} mostrarFornecedorInfo={false} />)
            )}
          </>
        )}

        {view === 'periodo' && (
          <>
            <div className="toolbar">
              <h1>Cobranças por Período</h1>
              <button className="btn-secondary" onClick={voltarParaMenu}>
                Voltar
              </button>
            </div>

            <div className="filters-bar" style={{ alignItems: 'flex-end' }}>
              <div>
                <label>Previsão de pagamento — de</label>
                <input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                />
              </div>
              <div>
                <label>até</label>
                <input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
              </div>
              <div>
                <button
                  type="button"
                  style={{ width: 'auto', padding: '10px 18px' }}
                  onClick={() => loadCobrancasPorPeriodo(periodoInicio, periodoFim)}
                >
                  Buscar
                </button>
              </div>
            </div>

            <LegendaStatusPagamento />

            {cobrancas.length > 0 && !showForm && (
              <button
                type="button"
                className="btn-secondary"
                style={{ marginBottom: 14 }}
                onClick={() => baixarPlanilha(cobrancas)}
              >
                ⬇ Baixar planilha (Excel)
              </button>
            )}

            {showForm ? null : cobrancas.length === 0 ? (
              <p className="empty-hint">
                {periodoInicio && periodoFim
                  ? 'Nenhuma cobrança com previsão de pagamento nesse período.'
                  : 'Escolha o período e clique em Buscar.'}
              </p>
            ) : (
              cobrancas.map((item) => <CobrancaBox key={item.id} item={item} mostrarFornecedorInfo />)
            )}
          </>
        )}

        {escolhaEdicao && (
          <div style={estiloOverlay}>
            <div className="section-card" style={{ maxWidth: 460, width: '100%' }}>
              <h2 style={{ marginBottom: 8 }}>Editar cobrança parcelada</h2>
              <p style={{ fontSize: 14, marginBottom: 16 }}>
                Esta cobrança está dividida em {escolhaEdicao.parcela_total} parcelas. O que você quer editar?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button type="button" style={{ width: '100%' }} onClick={escolherSomenteParcela}>
                  Somente esta parcela ({formatParcelaLabel(escolhaEdicao.parcela_atual, escolhaEdicao.parcela_total)})
                </button>
                <button
                  type="button"
                  style={{ width: '100%', background: 'var(--primary-dark)' }}
                  onClick={escolherCobrancaInteira}
                >
                  A cobrança como um todo (todas as {escolhaEdicao.parcela_total} parcelas)
                </button>
                <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={() => setEscolhaEdicao(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {editandoTodas && (
          <div style={estiloOverlay}>
            <form
              className="section-card"
              onSubmit={salvarTodas}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') e.preventDefault();
              }}
              style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div className="toolbar" style={{ marginBottom: 4 }}>
                <h2>Editar a cobrança inteira</h2>
                <button type="button" className="btn-secondary" onClick={() => setEditandoTodas(null)}>
                  Cancelar
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                As mudanças abaixo valem para todas as {editandoTodas.parcela_total} parcelas. Status, datas e NF de
                cada parcela continuam sendo editados parcela a parcela.
              </p>

              {erroTodas && <div className="error-box">{erroTodas}</div>}

              <div className="form-grid">
                <div>
                  <label>
                    Categoria <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>(campo obrigatório)</span>
                  </label>
                  <select value={formTodas.categoria} onChange={(e) => updateTodas('categoria', e.target.value)}>
                    <option value="">Selecione...</option>
                    {(editandoTodas.fornecedor_tipo === 'cliente' ? CATEGORIA_CLIENTE : CATEGORIA_FORNECEDOR).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!(editandoTodas.fornecedor_tipo === 'cliente' && formTodas.categoria === 'Assessoria') && (
                <>
                  <div className="form-section-title">Pedido</div>
                  <div className="form-grid">
                    <div>
                      <label>Pedido salvo</label>
                      <select value={formTodas.pedido_salvo} onChange={(e) => updateTodas('pedido_salvo', e.target.value)}>
                        <option value="">—</option>
                        <option value="sim">Sim</option>
                        <option value="não">Não</option>
                      </select>
                    </div>
                    <div>
                      <label>Número</label>
                      <input value={formTodas.pedido_numero} onChange={(e) => updateTodas('pedido_numero', e.target.value)} />
                    </div>
                    <div>
                      <label>Data</label>
                      <input
                        value={formTodas.pedido_data}
                        onChange={(e) => updateTodas('pedido_data', formatDataCurta(e.target.value))}
                        placeholder="DD/MM/AA"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label>Valor</label>
                      <input
                        value={formTodas.pedido_valor}
                        onChange={(e) => updateTodas('pedido_valor', sanitizeValorComCentavos(e.target.value))}
                        placeholder="1500 ou 1500,50"
                        inputMode="decimal"
                      />
                      {formTodas.pedido_valor && (
                        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -12, marginBottom: 18 }}>
                          = {previewValorComCentavos(formTodas.pedido_valor)}
                        </p>
                      )}
                    </div>
                  </div>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400, marginBottom: 16 }}>
                    <input
                      type="checkbox"
                      checked={!!formTodas.recalcular}
                      onChange={(e) => updateTodas('recalcular', e.target.checked)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Recalcular o valor de cada parcela (valor do pedido ÷ {editandoTodas.parcela_total}) — só nas parcelas
                    ainda não pagas
                  </label>

                  <div className="form-section-title">Programa de Fidelidade</div>
                  <div className="form-grid">
                    <div>
                      <label>Programa</label>
                      <input
                        value={formTodas.fidelidade_programa}
                        onChange={(e) => updateTodas('fidelidade_programa', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Status</label>
                      <select
                        value={formTodas.fidelidade_status}
                        onChange={(e) => updateTodas('fidelidade_status', e.target.value)}
                      >
                        <option value="">—</option>
                        <option value="Lançar">Lançar</option>
                        <option value="Creditado">Creditado ✅</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="form-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Observações</label>
                  <input value={formTodas.observacoes} onChange={(e) => updateTodas('observacoes', e.target.value)} />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={salvandoTodas}>
                  {salvandoTodas ? 'Salvando...' : 'Salvar em todas as parcelas'}
                </button>
              </div>
            </form>
          </div>
        )}

        <Rodape />
      </div>
    </div>
  );
}
