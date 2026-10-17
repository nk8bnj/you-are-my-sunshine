import type { GameState } from './types';

export const DIALOGUE: Array<{ speaker: 'Она' | 'Ты'; text: string; emphasis?: boolean; nextLabel?: string; options?: Array<{ text: string; reaction: string }> }> = [
  { speaker: 'Она', text: 'Букет собрала. Что дальше?' },
  { speaker: 'Ты', text: 'А дальше я хотел немного побыть с тобой.' },
  { speaker: 'Она', text: 'Поэтому заставил меня собирать цветы?' },
  { speaker: 'Ты', text: 'Ну, надо же было как-то красиво появиться.' },
  { speaker: 'Ты', text: 'Слушай, мы столько всего обсуждали. Решил вспомнить кое-что из наших разговоров.' },
  { speaker: 'Она', text: 'Только не говори, что опять четверть часа.' },
  { speaker: 'Ты', text: '…' },
  { speaker: 'Ты', text: 'Сколько минут в четверти часа?', options: [
    { text: '25 минут', reaction: 'Ты себе ещё десять минут накинула? Ладно, договоримся на 15.' },
    { text: '10 минут', reaction: 'Ещё пять минут где-то потерялись. Давай вернём их - будет 15.' },
    { text: '15 минут', reaction: '15! Всё, теперь можно официально подкалывать меня за этот вопрос.' },
  ] },
  { speaker: 'Ты', text: 'В каком году Украина стала независимым государством?', options: [
    { text: 'В 1991 году', reaction: 'Да, 1991! Чувствую, скоро вопросы тут будешь задавать ты.' },
    { text: 'В 1990 году', reaction: 'На год поторопилась - в 1991-м. Хотя я тоже уже тороплюсь к последнему вопросу.' },
    { text: 'В 1992 году', reaction: 'Отматываем на год назад - 1991. Всё, с датами я к тебе больше не пристаю.' },
  ] },
  { speaker: 'Ты', text: 'Машина едет с постоянной скоростью 80 км/ч, без остановок. За сколько она проедет 80 км?', options: [
    { text: 'За 80 минут', reaction: 'Это если ещё на кофе остановиться. А без остановок - за час.' },
    { text: 'За один час', reaction: 'Да, за час! С тобой я бы и дорогу подлиннее выбрал.' },
    { text: 'За полчаса', reaction: 'Так, Шумахер, мы никуда не опаздываем. На этой скорости - за час.' },
  ] },
  { speaker: 'Ты', text: 'Остался последний вопрос.', emphasis: true },
  { speaker: 'Она', text: 'Опять школьная программа?' },
  { speaker: 'Ты', text: 'Нет. Тут я сам ответа не знаю.', nextLabel: 'Слушаю…' },
  { speaker: 'Ты', text: 'Я люблю тебя подкалывать, но сейчас серьёзно. Ты мне очень нравишься. Хочу чаще тебя видеть, обнимать и просто быть рядом. Будешь моей девушкой?' },
];

export function advanceDialogue(state: GameState, choice?: number): GameState {
  if (state.phase !== 'dialogue' || !state.scene || state.scene.proposalPauseMs > 0) return state;
  const scene = state.scene;
  const line = DIALOGUE[scene.dialogueIndex];
  if (!line || scene.dialogueIndex === DIALOGUE.length - 1) return state;
  if (line.options && !scene.reaction) {
    const option = choice === undefined ? undefined : line.options[choice];
    return option ? { ...state, scene: { ...scene, reaction: option.reaction } } : state;
  }
  if (scene.dialogueIndex === DIALOGUE.length - 2) {
    return { ...state, scene: { ...scene, proposalPauseMs: 1200,
      companion: { ...scene.companion, target: { ...scene.companion.position, x: state.character.position.x + 78 }, isWalking: true },
    } };
  }
  return { ...state, scene: { ...scene, dialogueIndex: scene.dialogueIndex + 1, reaction: null } };
}
