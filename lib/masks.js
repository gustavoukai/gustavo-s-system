export function onlyDigits(value) {
  return (value || '').replace(/\D/g, '');
}

export function formatCPF(rawValue) {
  const d = onlyDigits(rawValue).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function formatRG(rawValue) {
  let cleaned = (rawValue || '').toUpperCase().replace(/[^0-9X]/g, '');

  // O X só é válido como último caractere (dígito verificador). Remove X's fora dessa posição.
  const lastIndexOfX = cleaned.lastIndexOf('X');
  if (lastIndexOfX !== -1) {
    cleaned = cleaned.slice(0, lastIndexOfX).replace(/X/g, '') + 'X';
  }
  cleaned = cleaned.slice(0, 9);

  if (cleaned.length <= 1) return cleaned;

  const verificador = cleaned.slice(-1);
  const corpo = cleaned.slice(0, -1); // até 8 dígitos

  const reversedChunks = [];
  const reversedCorpo = corpo.split('').reverse();
  for (let i = 0; i < reversedCorpo.length; i += 3) {
    reversedChunks.push(reversedCorpo.slice(i, i + 3).reverse().join(''));
  }
  const corpoFormatado = reversedChunks.reverse().join('.');

  return `${corpoFormatado}-${verificador}`;
}

export function formatPhone(rawValue) {
  const d = onlyDigits(rawValue).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;

  const ddd = d.slice(0, 2);
  const resto = d.slice(2);

  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  if (d.length <= 10) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5, 9)}`;
}

export function formatCNPJ(rawValue) {
  const d = onlyDigits(rawValue).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

export function formatParcela(rawValue) {
  const d = onlyDigits(rawValue).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function formatDataCurta(rawValue) {
  const d = onlyDigits(rawValue).slice(0, 6);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 6)}`;
}

export function formatValorReais(rawDigitsValue) {
  const d = onlyDigits(rawDigitsValue);
  if (!d) return '';
  const numero = parseInt(d, 10);
  return `R$ ${numero.toLocaleString('pt-BR')},00`;
}

// Usada dentro do campo enquanto o usuário digita: só separador de milhar, sem ",00" embutido
// (evita o bug de reinjetar os zeros de centavos a cada tecla).
export function formatValorDigitado(rawValue) {
  const d = onlyDigits(rawValue);
  if (!d) return '';
  return Number(d).toLocaleString('pt-BR');
}

export function parseValorReais(rawValueOuFormatado) {
  const d = onlyDigits(rawValueOuFormatado);
  return d ? parseInt(d, 10) : 0;
}

// Aceita dígitos e, opcionalmente, uma vírgula com até 2 casas decimais.
// Usada em campos de valor onde o usuário pode digitar os centavos ou não.
export function sanitizeValorLivre(rawValue) {
  let v = (rawValue || '').replace(/[^\d,]/g, '');
  const partes = v.split(',');
  if (partes.length > 2) {
    v = partes[0] + ',' + partes.slice(1).join('');
  }
  const [inteiro, centavos] = v.split(',');
  if (centavos !== undefined) {
    v = inteiro + ',' + centavos.slice(0, 2);
  }
  return v;
}

export function formatPreviewValorLivre(rawValue) {
  const v = sanitizeValorLivre(rawValue);
  if (!v) return '';
  let [inteiro, centavos] = v.split(',');
  if (centavos === undefined) centavos = '00';
  else if (centavos.length === 1) centavos = centavos + '0';
  else if (centavos.length === 0) centavos = '00';
  const inteiroNum = parseInt(inteiro || '0', 10);
  return `R$ ${inteiroNum.toLocaleString('pt-BR')},${centavos}`;
}

export function parseValorLivreParaNumero(rawValue) {
  const v = sanitizeValorLivre(rawValue);
  if (!v) return null;
  let [inteiro, centavos] = v.split(',');
  if (centavos === undefined) centavos = '00';
  else if (centavos.length === 1) centavos = centavos + '0';
  const inteiroNum = parseInt(inteiro || '0', 10);
  const centavosNum = parseInt(centavos || '0', 10);
  return inteiroNum + centavosNum / 100;
}

// Aceita dígitos e, opcionalmente, uma vírgula com os centavos.
// Sem vírgula = valor cheio (os centavos viram ,00 só na hora de mostrar/gravar).
export function sanitizeValorComCentavos(rawValue) {
  let limpo = (rawValue || '').replace(/[^0-9,]/g, '');
  const primeiraVirgula = limpo.indexOf(',');
  if (primeiraVirgula !== -1) {
    limpo =
      limpo.slice(0, primeiraVirgula + 1) +
      limpo.slice(primeiraVirgula + 1).replace(/,/g, '').slice(0, 2);
  }
  return limpo;
}

export function previewValorComCentavos(rawValue) {
  if (!rawValue) return '';
  const partes = rawValue.split(',');
  const inteiro = parseInt(partes[0].replace(/\D/g, '') || '0', 10);
  const temVirgula = partes.length > 1;
  const centavos = temVirgula ? (partes[1] || '').padEnd(2, '0').slice(0, 2) : '00';
  return `R$ ${inteiro.toLocaleString('pt-BR')},${centavos}`;
}

export function parseValorComCentavosParaNumero(rawValue) {
  if (!rawValue) return null;
  const partes = rawValue.split(',');
  const inteiro = parseInt(partes[0].replace(/\D/g, '') || '0', 10);
  const temVirgula = partes.length > 1;
  const centavos = temVirgula ? (partes[1] || '').padEnd(2, '0').slice(0, 2) : '00';
  return parseFloat(`${inteiro}.${centavos}`);
}

// Para campos de valor que aceitam vírgula e centavos (usados em Cobranças).
// O campo guarda o texto cru digitado (só dígitos e vírgula); estas funções
// só calculam a prévia formatada e o número final, sem reescrever o campo.
export function sanitizeValorComCentavos(rawValue) {
  const semLetras = (rawValue || '').replace(/[^0-9,]/g, '');
  const primeiraVirgula = semLetras.indexOf(',');
  if (primeiraVirgula === -1) return semLetras;
  return (
    semLetras.slice(0, primeiraVirgula + 1) +
    semLetras.slice(primeiraVirgula + 1).replace(/,/g, '').slice(0, 2)
  );
}

export function previewValorComCentavos(rawValue) {
  if (!rawValue) return '';
  const partes = rawValue.split(',');
  const inteiro = parseInt(partes[0] || '0', 10) || 0;
  const temVirgula = partes.length > 1;
  const centavos = temVirgula ? (partes[1] || '').padEnd(2, '0').slice(0, 2) : '00';
  return `R$ ${inteiro.toLocaleString('pt-BR')},${centavos}`;
}

export function parseValorComCentavos(rawValue) {
  if (!rawValue) return null;
  const partes = rawValue.split(',');
  const inteiro = parseInt(partes[0] || '0', 10) || 0;
  const temVirgula = partes.length > 1;
  const centavos = temVirgula ? (partes[1] || '').padEnd(2, '0').slice(0, 2) : '00';
  return parseFloat(`${inteiro}.${centavos}`);
}

export function formatCEP(rawValue) {
  const d = onlyDigits(rawValue).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

// Busca endereço pelo CEP usando o ViaCEP (serviço público e gratuito).
// Retorna null se o CEP não tiver 8 dígitos ou não for encontrado.
export async function buscarEnderecoPorCep(cepValue) {
  const d = onlyDigits(cepValue);
  if (d.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    const data = await response.json();
    if (data.erro) return null;
    return {
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || '',
    };
  } catch (e) {
    return null;
  }
}
