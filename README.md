# A Missão Secreta do Francisco

Convite interativo estático, em português europeu. O ecrã de boas-vindas permite começar/continuar, consultar «Como jogar» ou ver o convite diretamente. Joga no browser com teclado, toque ou os botões virtuais.

## Preparar e publicar

1. `npm install`
2. Editar **`src/data/config.ts`**: a morada em `address` aparece no convite e gera automaticamente o link «Ver localização» no Google Maps. Para ativar «Confirmar presença», preencher `whatsappNumber` (formato internacional sem `+`); sem número, esse botão fica indisponível.
3. `npm run dev` para testar; `npm run build` para gerar `dist/`.
4. Publicar `dist/` num alojamento estático (Vercel, Netlify, etc.).

O progresso fica no `localStorage` do browser. «Ver convite» é sempre acessível e não altera o progresso. «Jogar novamente» limpa o progresso depois de confirmação.

## Arte e licenças

- Cenário `public/assets/environment/`: terreno, árvores, vegetação, madeira e placa provenientes de **Shade**, [16x16 Puny World Tileset](https://opengameart.org/content/16x16-puny-world-tileset), **CC0**. Mapa composto a partir desses tiles; casas adaptadas e Pokébola, pedestais, geradores e notas desenhados para esta experiência. Os ícones dos desafios (folha, estrela e nota musical) são sprites **CC0** de **Boysano**, **Haley Halcyon** e **Spring Spring** (OpenGameArt). Ver `public/assets/environment/CREDITS.md`.
- Efeitos sonoros `public/assets/*.ogg`: **Kenney**, pack **Interface Sounds**, licença **CC0** (ver `public/assets/LICENSE-kenney.txt`).
- Música ambiente `public/assets/theme-v2.m4a`: composição original, mais suave e com cerca de 51 segundos antes de repetir. Pode ser regenerada com `python3 scripts/generate_theme.py` (requer `afconvert` ou `ffmpeg`); começa após a primeira interação. Não reproduz melodias ou gravações Pokémon: as [condições da biblioteca oficial](https://www.pokemon.com/us/legal/dp-sound-library) não permitem incorporar a música em jogos ou aplicações.
- Pokémon (Pikachu, Charmander, Rattata, Magikarp, Jigglypuff e Eevee): frames de movimento provenientes do [PMD Sprite Repository](https://sprites.pmdcollab.org/), adaptados para folhas 32×32 em `public/assets/pmd/`. A missão secundária da menina oferece a Pokébola para capturar Eevee no noroeste, junto ao lago, que depois segue o treinador; o progresso fica guardado. Créditos e distinção entre arte oficial e contribuições da comunidade em `public/assets/pmd/CREDITS.md`. **A licença CC BY-NC da comunidade não confere licença para redistribuir os sprites oficiais da Spike Chunsoft.** Confirmar as permissões necessárias antes de publicar o convite.
- Treinadores e restantes personagens humanas: oito personagens diferentes do pack [16-Char Sprite Collection (Modern Chibis, Asset Alliance)](https://finalbossblues.itch.io/16-char-sprite-collection-modern-chibis-asset-alliance) de **finalbossblues / Jason**, com movimentos nas quatro direções. Folhas adaptadas para cada personagem em `public/assets/people/`; detalhes em `public/assets/people/CREDITS.md`.
- Fontes da interface (`public/fonts`): DM Sans e Press Start 2P, disponibilizadas pelo Google Fonts sob a SIL Open Font License. Os ficheiros são servidos localmente, sem pedidos externos em runtime.
