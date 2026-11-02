/**
 * LUMINA — configuração central.
 *
 * Todo texto que aparece para a Luisa mora aqui.
 * Para personalizar o presente, edite apenas este arquivo.
 */

/** Paleta oficial "The Golden Eclipse". Espelhada como variáveis CSS em styles/tokens.css. */
export const palette = {
  obsidian: '#100F0D',
  charcoal: '#27211B',
  rust: '#A94F2B',
  amber: '#D88A3D',
  gold: '#C5A36B',
  champagne: '#E8D4AC',
  ivory: '#F1E7D2',
  copper: '#A87568',
} as const;

export interface StarMessage {
  id: string;
  number: string;
  title: string;
  text: string;
}

const stars: StarMessage[] = [
  {
    id: 'memes',
    number: '01',
    title: 'Correio de memes',
    text: 'Nossa conversa é 30% texto e 70% meme, e sinceramente é a melhor parte. Quando chega um seu do nada, eu já entendo o recado: "vi isso e lembrei de você".',
  },
  {
    id: 'sintonia',
    number: '02',
    title: 'Mesma frequência',
    text: 'Às vezes parece que a gente divide o mesmo cérebro: mesmos gostos, mesmos pensamentos, a mesma opinião antes de alguém falar. É raro achar alguém assim. Eu achei.',
  },
  {
    id: 'duo',
    number: '03',
    title: 'O melhor duo',
    text: 'Você segura o bomb, eu cubro o meio. Um nem termina de chamar e o outro já entendeu. Sintonia assim não se acha no matchmaking: o melhor duo do CS2 já está formado.',
  },
  {
    id: 'clutch',
    number: '04',
    title: 'A primeira a saber',
    text: 'Não sei dizer em que momento você virou uma das minhas pessoas favoritas. Só sei que, quando acontece algo bom, ou algo absurdo, você é a primeira pessoa para quem eu penso em contar.',
  },
  {
    id: 'voce',
    number: '05',
    title: 'Simplesmente você',
    text: 'Você é um amor de pessoa, do tipo que deixa tudo mais leve só por existir por perto. Eu te admiro de verdade, e esta estrela está aqui só para deixar isso escrito no céu.',
  },
];

export const birthday = {
  /** Nome da aniversariante. A constelação desenha L-U-I-S-A (ver utils/constellation.ts). */
  name: 'Luisa',
  project: {
    name: 'LUMINA',
    edition: 'The Golden Eclipse',
  },
  /** Data do aniversário (opcional). Se preenchida, aparece discretamente no mapa. Ex.: '14 de março'. */
  birthDate: '',

  /** Detalhes decorativos no estilo de mapas celestes antigos. */
  decor: {
    coordinates: 'AR 05h 34m 31s · Dec +22° 00′ 52″',
    mapTitle: 'Constelação de Luisa',
    mapSubtitle: '5 estrelas · brilho imensurável',
  },

  chapters: [
    { id: 'eclipse', numeral: 'I', label: 'O eclipse' },
    { id: 'welcome', numeral: 'II', label: 'Boas-vindas' },
    { id: 'constellation', numeral: 'III', label: 'A constelação' },
    { id: 'letter', numeral: 'IV', label: 'A cartinha' },
    { id: 'celebration', numeral: 'V', label: 'A celebração' },
  ],

  intro: {
    line: 'Em meio à imensidão do universo, existem pessoas que fazem tudo ficar um pouco mais bonito.',
    subtitle: 'Um pequeno universo feito especialmente para você.',
    button: 'Entrar no meu universo ✦',
    skipHint: 'Toque para continuar',
  },

  welcome: {
    eyebrow: 'Capítulo II',
    title: 'Bem-vinda ao seu universo, Luisa.',
    message:
      'Hoje, as estrelas têm algo especial para contar. Prepare-se para descobrir pequenas mensagens escondidas neste céu.',
    instruction: 'Cada estrela guarda uma mensagem para você.',
    button: 'Ver o céu ✦',
  },

  constellation: {
    eyebrow: 'Capítulo III',
    title: 'A constelação de Luisa',
    progress: (found: number, total: number) =>
      found === 0
        ? `${total} estrelas esperando por você`
        : found === total
          ? 'Todas as estrelas foram descobertas'
          : `${found} de ${total} estrelas descobertas`,
    starLabel: (n: string, title: string, found: boolean) =>
      `Estrela ${n}: ${title}${found ? ' (já descoberta)' : ''}`,
    back: 'Voltar ao céu',
    start: 'Ver a primeira estrela ✦',
    resume: 'Continuar o passeio ✦',
    hint: 'Ou toque direto em qualquer estrela',
    next: 'Próxima estrela ›',
    finish: 'Ver a constelação completa ✦',
    messageEyebrow: (n: string) => `Estrela ${n}`,
    completeMessage: 'Você descobriu todas as estrelas. Mas ainda existe uma surpresa esperando por você...',
    completeButton: 'Descobrir a surpresa ✦',
  },

  stars,

  letter: {
    eyebrow: 'Capítulo IV',
    title: 'Uma cartinha para você.',
    openButton: 'Abrir a cartinha',
    sealLabel: 'Abrir a cartinha',
    revealAll: 'Mostrar tudo',
    prevPage: 'Folha anterior',
    nextPage: 'Próxima folha',
    continueReading: 'Continuar lendo ›',
    folio: (page: number, total: number) => `folha ${page} de ${total}`,
    greeting: 'Luisa,',
    paragraphs: [
      'Hoje é o seu dia, e eu queria fazer algo um pouquinho diferente para celebrar você.',
      'Então resolvi criar este pequeno universo.',
      'Talvez ele seja apenas um site, com algumas estrelas e mensagens, mas cada detalhe foi pensado para tornar seu aniversário um pouquinho mais especial.',
      'Espero que este novo ciclo traga muitas alegrias, conquistas, momentos inesquecíveis e sonhos realizados.',
      'Que você continue sendo essa pessoa incrível, que nunca faltem motivos para sorrir e que a vida surpreenda você das maneiras mais bonitas possíveis.',
      'Obrigado por fazer parte da minha vida.',
      'Você merece um universo inteiro de coisas boas.',
      'Feliz aniversário! ❤️',
    ],
    signature: 'Com carinho, Thiago.',
    nextButton: 'Seguir para a celebração ✦',
  },

  finale: {
    title: 'Feliz aniversário, Luisa!',
    message:
      'Que este novo capítulo da sua vida seja tão bonito quanto o universo de possibilidades que existe à sua frente.',
    wishButton: 'Faça um pedido ✨',
    wishMessage:
      'Que todos os seus sonhos encontrem um caminho para se tornar realidade. Você merece coisas extraordinárias!',
    signature: 'Criei este universo para você. Com carinho, Thiago.',
    keepWatching: 'Continuar observando o céu',
    showAgain: 'Mostrar a mensagem',
    restart: 'Recomeçar a jornada',
  },

  navigation: {
    label: 'Capítulos da jornada',
    chapterAria: (numeral: string, label: string, locked: boolean, current: boolean) =>
      `Capítulo ${numeral}: ${label}${current ? ' (você está aqui)' : locked ? ' (ainda bloqueado)' : ''}`,
  },

  audio: {
    /** Arquivo em public/audio. Se não existir, o player não aparece e o site segue normalmente. */
    src: `${import.meta.env.BASE_URL}audio/trilha.mp3`,
    /** Começa a tocar ao tocar em "Entrar no meu universo" (é uma interação, então o navegador permite). */
    playOnEnter: true,
    initialVolume: 0.55,
    loop: true,
    labels: {
      group: 'Trilha sonora',
      play: 'Tocar trilha sonora',
      pause: 'Pausar trilha sonora',
      mute: 'Silenciar',
      unmute: 'Ativar som',
      volume: 'Volume',
    },
  },
};

export type ChapterIndex = 0 | 1 | 2 | 3 | 4;
