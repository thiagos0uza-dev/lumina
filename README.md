# LUMINA — The Golden Eclipse

Um pequeno universo feito para o aniversário da Luisa: um eclipse, uma constelação com o nome dela, uma cartinha e uma celebração final.

React + TypeScript + Vite · Canvas 2D para o céu · CSS para o eclipse · sem serviços externos.

## Rodar localmente

```bash
npm install
npm run dev        # desenvolvimento
npm run build      # build de produção em dist/
npm run preview    # serve o build em http://localhost:4173
```

## Personalizar

Todos os textos ficam em **`src/config/birthday.ts`**: nome, mensagens das estrelas, carta, assinatura, mensagem final, áudio e paleta.

## Trilha sonora (opcional)

Coloque um instrumental com licença de uso em `public/audio/trilha.mp3`. Se o arquivo não existir, o player não aparece e o site funciona normalmente.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie este projeto para a branch `main`.
2. No repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. O workflow `.github/workflows/deploy.yml` faz o build e publica sozinho a cada push.
4. O link fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

O `vite.config.ts` usa `base: './'`, então funciona com qualquer nome de repositório.

## Estrutura

```
src/
  animations/SpaceEngine.ts      motor do céu (estrelas, nebulosas, galáxia, partículas)
  config/birthday.ts             todos os textos e configurações
  components/
    SpaceBackground/             canvas único compartilhado entre os capítulos
    Eclipse/                     eclipse em camadas de CSS
    Intro/ Welcome/ Constellation/ Letter/ FinalCelebration/
    Navigation/ MusicPlayer/ Brand/
  hooks/                         áudio, linha do tempo, movimento reduzido
  utils/constellation.ts         geometria da constelação L-U-I-S-A
```
