# BaseRogue

Roguelike de béisbol por turnos, jugado con un dado d100. Draftea una alineación de 9 leyendas históricas (o reales de una temporada específica), armá sinergias de era, y derrotá rotaciones rivales de 3 pitchers en series de 3 entradas para llegar a campeón.

Sitio estático — sin build step, sin framework. Todo es HTML/CSS/JS plano servido directamente.

## Correr localmente

No hace falta instalar nada de Node — es un sitio 100% estático. Cualquier servidor HTTP simple sirve:

```bash
python -m http.server 8000
```

y abrir `http://localhost:8000/index.html`. Abrir `index.html` directamente como `file://` también funciona para la mayoría de las pantallas, pero rompe el default de idioma (ver nota en `src/i18n.js` sobre por qué el init es síncrono) y puede tener problemas de CORS con algunos assets — preferir siempre un server.

**Cache**: los `<script>`/`<link>` en `index.html` usan `?v=N` como cache-busting manual. Si editás `ui.js`, `game.js`, `simulation.js`, `style.css` o `src/i18n.js` y no ves el cambio reflejado, subí el número de versión de ese archivo en `index.html`.

## Estructura del código

| Archivo | Qué hace |
|---|---|
| `index.html` | Todas las pantallas (mode-select, draft, mapa, combate, modales) viven acá, se muestran/ocultan con `.hidden` |
| `game.js` | Estado del run (`GameState`/`window.Game`): roster, mapa, sinergias, draft, historial |
| `simulation.js` | Motor de combate (`InteractiveBattle`): probabilidades del dado (`calcBoundaries`), resolución de cada tirada, lógica de sinergias de era en combate |
| `ui.js` | Todo el renderizado DOM y los event listeners — el archivo más grande, agrupa por pantalla |
| `players.js` | Pool de bateadores legendarios (fallback), definición de Eras y sus sinergias (`EraTraits`) |
| `pitchers_pool.js`, `game_cards_pool.js` | Pools generados por los scripts ETL — NO editar a mano |
| `opponents_database.js` | Rosters de Story Mode por año (1901-2025) — generado, NO editar a mano |
| `src/i18n.js` | Sistema de traducción ES/EN (`window.t()`), default `en`, persistido en `localStorage` |
| `audio.js` | Sonidos sintetizados con Web Audio API, sin archivos de audio externos |
| `basedex.js` | El "BaseballDex" — pool de cartas coleccionables/desbloqueables |

## Scripts ETL (generan los pools de datos desde Lahman + Baseball-Reference)

Requieren `pip install pandas numpy` y los CSVs de `lahman_1871-2025/` (Lahman Database + `war_daily_bat.txt`/`war_daily_pitch.txt` de Baseball-Reference).

- **`lahman_etl_v5.py`** → `game_cards.csv` / `game_cards_pool.js` — pool de bateadores para el draft (Quick Play y Story Mode comparten este pool para bateadores). Selecciona el pico de 7 mejores temporadas por WAR de cada jugador.
- **`pitchers_etl.py`** → `pitchers_pool.csv` / `pitchers_pool.js` — pool de pitchers rivales para **Quick Play**. Mismo criterio de pico de 7 años, con un boost 1.6x al WAR de temporadas de relevo dominante al rankear qué años entran en el pico (ver `RELIEF_WAR_BOOST`), para que un pitcher como Eckersley no pierda sus mejores años como cerrador frente a años mediocres como abridor.
- **`story_pitchers_etl.py`** → `opponents_database.js` — rosters de **Story Mode**, un pitcher-temporada individual por año (no picos de carrera). Reutiliza las mismas fórmulas que `pitchers_etl.py` (suavizado bayesiano, curva de OVR, umbrales de rareza) pero aplicadas a una sola temporada. Escribe primero a `opponents_database.preview.js` — copiar a mano sobre `opponents_database.js` después de revisar el resultado.
- **`export_career_db.py`** → `career_data.js` — stats de carrera completa (no pico) para mostrar en el resumen de fin de run / BaseballDex.

Ejecutar cualquiera con `python <script>.py` desde la raíz del proyecto.

## Deploy

Vercel, conectado al repo de GitHub (`origin`) — deploy automático al pushear a `main`. No hay `vercel.json` ni build step; Vercel sirve los archivos estáticos tal cual.
