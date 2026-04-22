import {
  localIsoDateToday,
  dateToIsoYmdLocal,
  parseIsoYmdToLocalDate,
  isValidIsoYmd,
  todayBrazilianDateString,
  isoYmdToBrazilian,
  expenseRawDateToBrazilian,
  formatBrazilianDateTyping,
  parseBrazilianDateToIso,
  formatDayAndMonthLongLocal,
} from '../dateLocale';

describe('dateLocale', () => {
  describe('localIsoDateToday', () => {
    test('retorna data atual em formato YYYY-MM-DD', () => {
      const result = localIsoDateToday();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(result).toBe(expected);
    });
  });

  describe('dateToIsoYmdLocal', () => {
    test('converte Date para YYYY-MM-DD', () => {
      const date = new Date(2024, 5, 15); // 15 de junho de 2024
      expect(dateToIsoYmdLocal(date)).toBe('2024-06-15');
    });

    test('adiciona zero padding para mês e dia', () => {
      const date = new Date(2024, 0, 5); // 5 de janeiro de 2024
      expect(dateToIsoYmdLocal(date)).toBe('2024-01-05');
    });

    test('lida com ano de 4 dígitos corretamente', () => {
      const date = new Date(2000, 0, 1);
      expect(dateToIsoYmdLocal(date)).toBe('2000-01-01');
    });
  });

  describe('parseIsoYmdToLocalDate', () => {
    test('converte YYYY-MM-DD para Date local', () => {
      const result = parseIsoYmdToLocalDate('2024-06-15');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(5); // junho = 5 (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    test('ignora parte após 10 caracteres', () => {
      const result = parseIsoYmdToLocalDate('2024-06-15T10:30:00Z');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(15);
    });

    test('retorna data atual para formato inválido', () => {
      const now = new Date();
      const result = parseIsoYmdToLocalDate('invalid-date');
      expect(result.getDate()).toBe(now.getDate());
    });

    test('retorna data atual para data inexistente (30/02)', () => {
      const now = new Date();
      const result = parseIsoYmdToLocalDate('2024-02-30');
      expect(result.getDate()).toBe(now.getDate());
    });

    test('remove espaços em branco', () => {
      const result = parseIsoYmdToLocalDate('  2024-06-15  ');
      expect(result.getFullYear()).toBe(2024);
    });
  });

  describe('isValidIsoYmd', () => {
    test('valida data ISO correta', () => {
      expect(isValidIsoYmd('2024-06-15')).toBe(true);
      expect(isValidIsoYmd('2024-01-01')).toBe(true);
      expect(isValidIsoYmd('2024-12-31')).toBe(true);
    });

    test('rejeita formato inválido', () => {
      expect(isValidIsoYmd('2024/06/15')).toBe(false);
      expect(isValidIsoYmd('15-06-2024')).toBe(false);
      expect(isValidIsoYmd('invalid')).toBe(false);
      expect(isValidIsoYmd('')).toBe(false);
    });

    test('rejeita datas inexistentes', () => {
      expect(isValidIsoYmd('2024-02-30')).toBe(false); // fevereiro não tem 30 dias
      expect(isValidIsoYmd('2024-13-01')).toBe(false); // mês 13 não existe
      expect(isValidIsoYmd('2024-00-15')).toBe(false); // mês 0 não existe
    });

    test('valida anos bissextos corretamente', () => {
      expect(isValidIsoYmd('2024-02-29')).toBe(true);  // 2024 é bissexto
      expect(isValidIsoYmd('2023-02-29')).toBe(false); // 2023 não é bissexto
    });
  });

  describe('todayBrazilianDateString', () => {
    test('retorna data atual em formato DD/MM/AAAA', () => {
      const result = todayBrazilianDateString();
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);

      const today = new Date();
      const expected = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      expect(result).toBe(expected);
    });
  });

  describe('isoYmdToBrazilian', () => {
    test('converte YYYY-MM-DD para DD/MM/AAAA', () => {
      expect(isoYmdToBrazilian('2024-06-15')).toBe('15/06/2024');
      expect(isoYmdToBrazilian('2024-01-01')).toBe('01/01/2024');
    });

    test('lida com timestamp ISO completo', () => {
      expect(isoYmdToBrazilian('2024-06-15T10:30:00.000Z')).toBe('15/06/2024');
    });

    test('retorna hoje para formato inválido', () => {
      const today = todayBrazilianDateString();
      expect(isoYmdToBrazilian('invalid')).toBe(today);
    });

    test('remove espaços em branco', () => {
      expect(isoYmdToBrazilian('  2024-06-15  ')).toBe('15/06/2024');
    });
  });

  describe('expenseRawDateToBrazilian', () => {
    test('converte data ISO para DD/MM/AAAA', () => {
      expect(expenseRawDateToBrazilian('2024-06-15')).toBe('15/06/2024');
    });

    test('lida com timestamp ISO completo', () => {
      expect(expenseRawDateToBrazilian('2024-06-15T10:30:00.000Z')).toBe('15/06/2024');
    });

    test('retorna hoje para formato não reconhecido', () => {
      const today = todayBrazilianDateString();
      expect(expenseRawDateToBrazilian('15/06/2024')).toBe(today);
      expect(expenseRawDateToBrazilian('invalid')).toBe(today);
    });
  });

  describe('formatBrazilianDateTyping', () => {
    test('mascara entrada enquanto digita', () => {
      expect(formatBrazilianDateTyping('1')).toBe('1');
      expect(formatBrazilianDateTyping('15')).toBe('15');
      expect(formatBrazilianDateTyping('150')).toBe('15/0');
      expect(formatBrazilianDateTyping('1506')).toBe('15/06');
      expect(formatBrazilianDateTyping('15062')).toBe('15/06/2');
      expect(formatBrazilianDateTyping('15062024')).toBe('15/06/2024');
    });

    test('remove caracteres não numéricos', () => {
      expect(formatBrazilianDateTyping('1a5')).toBe('15');
      expect(formatBrazilianDateTyping('15/06')).toBe('15/06');
      expect(formatBrazilianDateTyping('15.06.2024')).toBe('15/06/2024');
    });

    test('limita a 8 dígitos', () => {
      expect(formatBrazilianDateTyping('1506202499')).toBe('15/06/2024');
    });
  });

  describe('parseBrazilianDateToIso', () => {
    test('converte DD/MM/AAAA para YYYY-MM-DD', () => {
      expect(parseBrazilianDateToIso('15/06/2024')).toBe('2024-06-15');
      expect(parseBrazilianDateToIso('01/01/2024')).toBe('2024-01-01');
    });

    test('aceita entrada sem separadores', () => {
      expect(parseBrazilianDateToIso('15062024')).toBe('2024-06-15');
    });

    test('retorna null para data incompleta', () => {
      expect(parseBrazilianDateToIso('15/06')).toBeNull();
      expect(parseBrazilianDateToIso('15')).toBeNull();
      expect(parseBrazilianDateToIso('')).toBeNull();
    });

    test('retorna null para mês inválido', () => {
      expect(parseBrazilianDateToIso('15/13/2024')).toBeNull(); // mês 13
      expect(parseBrazilianDateToIso('15/00/2024')).toBeNull(); // mês 0
    });

    test('retorna null para dia inválido', () => {
      expect(parseBrazilianDateToIso('32/06/2024')).toBeNull(); // dia 32
      expect(parseBrazilianDateToIso('00/06/2024')).toBeNull(); // dia 0
    });

    test('retorna null para datas inexistentes', () => {
      expect(parseBrazilianDateToIso('30/02/2024')).toBeNull(); // fevereiro não tem 30
      expect(parseBrazilianDateToIso('31/04/2024')).toBeNull(); // abril não tem 31
    });

    test('valida anos bissextos', () => {
      expect(parseBrazilianDateToIso('29/02/2024')).toBe('2024-02-29'); // bissexto
      expect(parseBrazilianDateToIso('29/02/2023')).toBeNull(); // não bissexto
    });
  });

  describe('formatDayAndMonthLongLocal', () => {
    test('formata dia e mês por extenso', () => {
      const date = new Date(2024, 3, 15); // 15 de abril de 2024
      const result = formatDayAndMonthLongLocal(date);
      expect(result).toBe('15 de abril');
    });

    test('usa data atual se não fornecida', () => {
      const result = formatDayAndMonthLongLocal();
      const today = new Date();
      expect(result).toContain(String(today.getDate()));
    });
  });
});
