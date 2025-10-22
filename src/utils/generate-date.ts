import {
  eachDayOfInterval,
  endOfDay,
  format,
  getDay,
  isAfter,
  parseISO,
  startOfDay,
} from "date-fns";

/**
 * Gera um array de datas baseado em dias da semana específicos
 * @param startDate - Data inicial no formato YYYY-MM-DD
 * @param endDate - Data final no formato YYYY-MM-DD
 * @param daysOfWeek - Array com dias da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
 * @returns Array de datas no formato YYYY-MM-DD
 */
export function generateClassDates(
  startDate: string,
  endDate: string,
  daysOfWeek: number[]
): string[] {
  if (!startDate || !endDate) {
    throw new Error("Datas inválidas");
  }

  const start = startOfDay(parseISO(startDate));
  const end = endOfDay(parseISO(endDate));
  // Validar se a data de início não é posterior à data final
  if (isAfter(start, end)) {
    throw new Error("Data de início não pode ser posterior à data final");
  }

  // Gerar todas as datas no intervalo
  const allDates = eachDayOfInterval({ start, end });

  // Filtrar apenas os dias da semana desejados
  const filteredDates = allDates.filter((date) => {
    const dayOfWeek = getDay(date);
    return daysOfWeek.includes(dayOfWeek);
  });

  // Formatar as datas para YYYY-MM-DD
  return filteredDates.map((date) => format(date, "yyyy-MM-dd"));
}
