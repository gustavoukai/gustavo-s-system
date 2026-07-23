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

export function formatCEP(rawValue) {
  const d = onlyDigits(rawValue).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatCNPJ(rawValue) {
  const d = onlyDigits(rawValue).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
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
