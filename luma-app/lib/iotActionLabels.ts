/**
 * Rótulos pt-BR para códigos de ação de dispositivo (`device_actions.action`).
 * Amplie quando novos comandos forem suportados.
 */
const ACTION_LABELS: Record<string, string> = {
  start_cleaning: 'Limpar quarto',
  stop: 'Parar',
  go_to_room: 'Ir ao cômodo',
  set_temperature: 'Ajustar temperatura',
  turn_on: 'Ligar',
  turn_off: 'Desligar',
};

export function getIoTActionLabelPt(actionKey: string): string {
  return ACTION_LABELS[actionKey] ?? actionKey;
}
