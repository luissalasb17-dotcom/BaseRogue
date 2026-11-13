# Estudio Completo: Renovación de la Insignia Clubhouse Leader (BaseRogue)

Este documento resume el análisis integral y las decisiones finales tomadas era por era para renovar la lista de jugadores con la insignia **Clubhouse Leader** (campo `is_captain` / `badge_captain`, alimentado desde `captains_ids.csv`) en **BaseRogue**.

---

## 1. Contexto y Criterios Acordados

### Mecánica e impacto en el juego
* En `challenge162.js`, la insignia (`p.captain || p.is_captain || p.badge_captain`) otorga **+1 de rating a los compañeros de equipo** (hasta un máximo de +3).
* La fuente de verdad para generar la insignia en los pools de bateadores (`lahman_etl_v5.py` → `game_cards_pool.js`) y pitchers (`pitchers_etl.py` → `pitchers_pool.csv` / `pitchers_pool.js`) es **`captains_ids.csv`** (`playerID,type,name`).
* Estado previo de `captains_ids.csv`: **377 entradas** (295 `BAT`, 82 `PIT`).

### Reglas de evaluación aplicadas en las 9 eras
1. **Estándar único e individual (BAT y PIT por igual):** No se usó un estándar separado de "ancla de rotación" para pitchers; todos se evaluaron por su peso real como líderes de vestuario.
2. **Sin penalización por equipo:** Que haya 2 o más líderes en un mismo equipo (ej. Dodgers actuales, Yankees de los 90, Big Red Machine) no excluye a nadie si cada jugador tiene mérito individual probado.
3. **Qué SÍ entra:**
   * Capitanes oficiales con peso real en el clubhouse.
   * Líderes de facto ("C invisible") que marcaban el estándar competitivo, mentoreaban jóvenes y elevaban el rendimiento colectivo.
   * Mánagers-jugadores históricos con autoridad real (especialmente Genesis, Deadball, Golden Era y Negro Leagues).
   * Catalizadores de cultura ganadora comprobada en múltiples vestuarios o franquicias (ej. Lorenzo Cain, Mike Napoli, Austin Hedges, Martín Prado).
4. **Qué NO entra (filtro estricto):**
   * Superestrellas o íconos de franquicia de perfil callado, introvertido o solitario (ej. Ty Cobb, Honus Wagner, Satchel Paige, Joe Mauer, Zack Greinke, Shohei Ohtani, Ichiro).
   * Capitanes simbólicos de 1 temporada o bromas internas (ej. Brandon Belt).
   * Jugadores tóxicos, divisivos o descalificados por escándalos graves de integridad/vestuario (ej. Brian McCann y Carlos Beltrán por implantar el robo de señas de Houston 2017; Robinson Canó, Ryan Braun, Aroldis Chapman, Jonathan Papelbon, Curt Schilling).
   * Jugadores queridos solo por humor o "buen ambiente" (*good vibes*) sin autoridad o impacto estructural en el clubhouse (ej. Juan Uribe, Ryan Dempster, Jonny Gomes, Eugenio Suárez, Teoscar Hernández).

---

## 2. Resumen Ejecutivo para Aplicación Técnica

* **Total de entradas nuevas (`ENTRAN`):** **34**
* **Total de bajas (`SALEN`):** **101**
* **Balance neto esperado en `captains_ids.csv`:** `377 - 101 + 34 =` **310 entradas exactas**.
* **Pasos sugeridos para Claude:**
  1. Eliminar las **101** filas indicadas en `SALEN` de `captains_ids.csv` (respetando la pareja `playerID,type`).
  2. Agregar las **34** filas indicadas en `ENTRAN` a `captains_ids.csv`.
  3. Verificar que no queden duplicados y que `captains_ids.csv` quede con **310** filas de datos (+ cabecera `playerID,type,name`).
  4. Re-ejecutar los scripts ETL (`lahman_etl_v5.py` y `pitchers_etl.py`, o el pipeline correspondiente) para regenerar `game_cards_pool.js`, `pitchers_pool.csv` / `pitchers_pool.js` con el `is_captain` actualizado.

---

## 3. Estudio y Cambios Era por Era

### Era 1: The Genesis Era (1871-1900)
* **Balance:** Se mantienen **19**, entran **2**, salen **13** (**Total: 21**).
* **Contexto clave:** Se conservaron los grandes capitanes y mánagers-jugadores fundacionales (Cap Anson, King Kelly, John McGraw, Buck Ewing, Ned Hanlon, Harry Wright, John Ward, Charlie Comiskey, Clark Griffith, Hughie Jennings, etc.). Entraron **Cy Young** (figura paternal y referente absoluto de sus equipos) y **George Wright** (líder de los históricos Red Stockings). Salieron estrellas silenciosas o perfiles conflictivos/menores (Willie Keeler, Jack Glasscock, Patsy Tebeau, Lip Pike, etc.).

**ENTRAN (2):**
```csv
youngcy01,PIT,Cy Young
wrighge01,BAT,George Wright
```

**SALEN (13):**
```csv
glassja01,BAT,Jack Glasscock
keelewi01,BAT,Willie Keeler
mcveyca01,BAT,Cal McVey
pikeli01,BAT,Lip Pike
doyleja01,BAT,Jack Doyle
foutzda01,BAT,Dave Foutz
mcguide01,BAT,Deacon McGuire
clappjo01,BAT,John Clapp
corcoto01,BAT,Tommy Corcoran
mcbridi01,PIT,Dick McBride
donovpa01,BAT,Patsy Donovan
tebeapa01,BAT,Patsy Tebeau
fergubo01,BAT,Bob Ferguson
```

---

### Era 2: Deadball (1901-1919)
* **Balance:** Se mantienen **25**, entran **0**, salen **16** (**Total: 25**).
* **Contexto clave:** Se mantuvieron líderes indiscutibles como Tris Speaker, Walter Johnson, Nap Lajoie, Christy Mathewson, Eddie Collins, Frank Chance, Fred Clarke, Rube Foster, John Henry Lloyd, Pete Hill, Dick Redding y Ray Schalk. Se excluyó a superestrellas solitarias o conflictivas (Ty Cobb, Honus Wagner) y salieron jugadores de rol o capitanes sin peso real (Johnny Evers, Joe Tinker, Smokey Joe Williams, Heinie Groh, Jack Barry, etc.).

**ENTRAN (0):** *(ninguno)*

**SALEN (16):**
```csv
willijo99,PIT,Joe Williams
eversjo01,BAT,Johnny Evers
tinkejo01,BAT,Joe Tinker
grohhe01,BAT,Heinie Groh
tennefr02,BAT,Fred Tenney
dismudi01,PIT,Dizzy Dismukes
mcganda01,BAT,Dan McGann
elberki01,BAT,Kid Elberfeld
pettubi01,BAT,Bill Pettus
johnsgr02,BAT,Grant Johnson
chacope01,BAT,Pelayo Chacón
barryja01,BAT,Jack Barry
stahlja01,BAT,Jake Stahl
scottev01,BAT,Everett Scott
wagnehe01,BAT,Heinie Wagner
coughbi01,BAT,Bill Coughlin
```

---

### Era 3: Golden Era (1920-1941)
* **Balance:** Se mantienen **26** (nota: verificar si `Jimmy Dykes` sigue en el CSV actual), entran **4**, salen **15** (**Total: ~30**).
* **Contexto clave:** Se conservaron Lou Gehrig, Jimmie Foxx, Mel Ott, Frankie Frisch, Bill Dickey, Mickey Cochrane, Gabby Hartnett, Oscar Charleston, Buck Leonard, Bullet Rogan, Willie Wells, Biz Mackey, etc. Entraron **Joe DiMaggio** (referente silencioso pero con autoridad total en los Yankees), **Arky Vaughan**, **Hank Greenberg** y **Zack Wheat** (capitán histórico de Brooklyn). Salieron perfiles erráticos, conflictivos o nómadas (Satchel Paige, Leo Durocher, Burleigh Grimes, Dolf Luque, Carl Hubbell, Edd Roush, etc.).

**ENTRAN (4):**
```csv
dimagjo01,BAT,Joe DiMaggio
vaughar01,BAT,Arky Vaughan
greenha01,BAT,Hank Greenberg
wheatza01,BAT,Zack Wheat
```

**SALEN (15):**
```csv
paigesa01,PIT,Satchel Paige
hubbeca01,PIT,Carl Hubbell
grimebu01,PIT,Burleigh Grimes
luquedo01,PIT,Dolf Luque
roushed01,BAT,Edd Roush
bancrda01,BAT,Dave Bancroft
coopean99,PIT,Andy Cooper
mcdonwe01,PIT,Webster McDonald
durocle01,BAT,Leo Durocher
malarda01,BAT,Dave Malarcher
warfifr01,BAT,Frank Warfield
snowfe01,BAT,Felton Snow
demosbi01,BAT,Bingo DeMoss
kammwi01,BAT,Willie Kamm
wilsoji01,BAT,Jimmie Wilson
```

---

### Era 4: Integration (1942-1960)
* **Balance:** Se mantienen **22**, entran **3**, salen **10** (**Total: 25**).
* **Contexto clave:** Se aprobaron las entradas de **Minnie Miñoso** (mentor y líder pionero en White Sox), **Richie Ashburn** y **Phil Rizzuto**, y se ratificó mantener a Monte Irvin, Bobby Doerr y Allie Reynolds junto a pilares como Stan Musial, Jackie Robinson, Pee Wee Reese, Yogi Berra, Roy Campanella, Ernie Banks, Gil Hodges, Buck O'Neil y Warren Spahn. Salieron Duke Snider (perfil más retraído), Early Wynn, Johnny Sain, Vern Law, etc.

**ENTRAN (3):**
```csv
minosmi01,BAT,Minnie Miñoso
ashburi01,BAT,Richie Ashburn
rizzuph01,BAT,Phil Rizzuto
```

**SALEN (10):**
```csv
snidedu01,BAT,Duke Snider
wynnea01,PIT,Early Wynn
sainjo01,PIT,Johnny Sain
lawve01,PIT,Vern Law
erskica01,PIT,Carl Erskine
hutchfr01,PIT,Fred Hutchinson
crandde01,BAT,Del Crandall
stanked01,BAT,Eddie Stanky
marioma01,BAT,Marty Marion
hamnegr01,BAT,Granny Hamner
```

---

### Era 5: Expansion (1961-1976)
* **Balance:** Se mantienen **34**, entra **1**, salen **11** (**Total: 35**).
* **Contexto clave:** Se cerró tras revisar con lupa el peso de los capitanes oficiales: se mantuvo a **Maury Wills** (capitán oficial y líder táctico de los Dodgers) pero salió **Bill Mazeroski** (capitán tardío de 1 año en Pittsburgh donde el líder era Clemente/Stargell) y se descartó a Ron Cey. Entró **Jim Kaat** (líder vocal y mentor de pitcheo de los Twins). Salieron estrellas silenciosas o sin peso de capitán (Lou Brock, Orlando Cepeda, Phil Niekro, Tommy John, Mickey Lolich, Bobby Richardson, etc.).

**ENTRAN (1):**
```csv
kaatji01,PIT,Jim Kaat
```

**SALEN (11):**
```csv
smithre06,BAT,Reggie Smith
niekrph01,PIT,Phil Niekro
lolicmi01,PIT,Mickey Lolich
johnto01,PIT,Tommy John
cepedor01,BAT,Orlando Cepeda
aloufe01,BAT,Felipe Alou
brocklo01,BAT,Lou Brock
whitebi03,BAT,Bill White
fregoji01,BAT,Jim Fregosi
mazerbi01,BAT,Bill Mazeroski
richabo01,BAT,Bobby Richardson
```

---

### Era 6: Turf Era (1977-1993)
* **Balance:** Se mantienen **40**, entran **2**, salen **9** (**Total: 42**).
* **Contexto clave:** Se ratificó mantener a **Davey Lopes** (capitán oficial y voz clave de los Dodgers, luego coach/mánager muy respetado) junto a George Brett, Mike Schmidt, Cal Ripken Jr., Tony Gwynn, Eddie Murray, Gary Carter, Keith Hernandez, Don Mattingly, Kirk Gibson, Dave Stewart, etc. Entraron **Alan Trammell** (capitán silencioso pero indiscutible de los Tigers) y **Will Clark** (líder competitivo de los Giants). Salieron Andre Dawson (callado), Jack Morris, Steve Garvey, Joe Carter, Quisenberry, Tekulve, etc.

**ENTRAN (2):**
```csv
trammal01,BAT,Alan Trammell
clarkwi02,BAT,Will Clark
```

**SALEN (9):**
```csv
dawsoan01,BAT,Andre Dawson
morrija02,PIT,Jack Morris
daviser01,BAT,Eric Davis
garvest01,BAT,Steve Garvey
madlobi01,BAT,Bill Madlock
singlke01,BAT,Ken Singleton
tekulke01,PIT,Kent Tekulve
quiseda01,PIT,Dan Quisenberry
cartejo01,BAT,Joe Carter
```

---

### Era 7: Steroid Era (1994-2005)
* **Balance:** Se mantienen **32**, entran **5**, salen **11** (**Total: 37**).
* **Contexto clave:** Se hizo una revisión profunda de los sin insignia: entraron **Bernie Williams**, **Tino Martinez** (ambos piezas centrales del vestuario de la dinastía Yankee junto a Jeter/O'Neill/Posada/Rivera), **Scott Rolen**, **Lance Berkman** y **Mark Grace**. Se decidió dejar fuera a **Omar Vizquel** (por controversias personales/fuera del campo y ser más líder defensivo que capitán general) y a **Robin Ventura**. Salieron Curt Schilling, Mo Vaughn, Miguel Tejada, Tim Wakefield, Joe Girardi, Brad Ausmus, Alex Cora, etc.

**ENTRAN (5):**
```csv
rolensc01,BAT,Scott Rolen
willibe02,BAT,Bernie Williams
berkmla01,BAT,Lance Berkman
gracema01,BAT,Mark Grace
martiti02,BAT,Tino Martinez
```

**SALEN (11):**
```csv
schilcu01,PIT,Curt Schilling
brocado01,PIT,Doug Brocail
ausmubr01,BAT,Brad Ausmus
girarjo01,BAT,Joe Girardi
coraal01,BAT,Alex Cora
clarkto02,BAT,Tony Clark
vaughmo01,BAT,Mo Vaughn
tejadmi01,BAT,Miguel Tejada
wakefti01,PIT,Tim Wakefield
kileda01,PIT,Darryl Kile
timlimi01,PIT,Mike Timlin
```

---

### Era 8: Moneyball Era (2006-2015)
* **Balance:** Se mantienen **40** (32 BAT + 8 PIT), entran **6**, salen **10** (**Total: 46**).
* **Contexto clave:**
  * Se mantuvieron casos límite con evidencia explícita de liderazgo: Jason Heyward, Alex Gordon, Carlos Ruiz, Michael Cuddyer, David Ross, Stephen Vogt y **Mike Napoli** (tras revisión con lupa: pilar cultural probado en 3 franquicias de Serie Mundial —Texas 2011, Boston 2013 y Cleveland 2016—).
  * Entraron **Miguel Cabrera**, **Ben Zobrist**, **Ian Kinsler**, **Michael Brantley**, **Elvis Andrus** y **Martín Prado** (capitán no oficial en Braves/Marlins).
  * En los casos 50/50 se decidió dejar fuera a **Félix Hernández** (fricciones finales en Seattle y sin rol de general de vestuario) y a **Howie Kendrick** (excelente profesional, pero en Washington mandaban Zimmerman y Scherzer).
  * Salieron **Joe Mauer** y **Johan Santana** (estrellas introvertidas), **Brian McCann** (rol central en Astros 2017; también quedó fuera Carlos Beltrán), **Shane Victorino** (más *sparkplug* que autoridad de vestuario), **Juan Uribe** (humor/buen ambiente sin peso de capitán), Mark Buehrle, Víctor Martínez, Ryan Dempster, Jonny Gomes y A.J. Ellis.

**ENTRAN (6):**
```csv
cabremi01,BAT,Miguel Cabrera
zobribe01,BAT,Ben Zobrist
kinslia01,BAT,Ian Kinsler
brantmi02,BAT,Michael Brantley
andruel01,BAT,Elvis Andrus
pradoma01,BAT,Martin Prado
```

**SALEN (10):**
```csv
mauerjo01,BAT,Joe Mauer
mccanbr01,BAT,Brian McCann
victosh01,BAT,Shane Victorino
martivi01,BAT,Victor Martinez
uribeju01,BAT,Juan Uribe
gomesjo01,BAT,Jonny Gomes
ellisaj01,BAT,A.J. Ellis
santajo01,PIT,Johan Santana
buehrma01,PIT,Mark Buehrle
dempsry01,PIT,Ryan Dempster
```

---

### Era 9: Statcast Era (2016-Pres)
* **Balance:** Se mantienen **35** (30 BAT + 5 PIT), entran **11**, salen **6** (**Total: 46**).
* **Contexto clave:**
  * Se mantuvieron **Mike Trout** (capitán Team USA y mentor en Angels), **Bobby Witt Jr.** (primer jugador en la historia en ganar 3 *Heart & Hustle Awards* seguidos), **José Altuve** (se negó a usar el sistema de 2017 y es el alma de Houston), **Correa / Bregman / Springer** (veteranos mentores probados en MIN/BOS/TOR tras 2017), **Lorenzo Cain** (su salida en 2022 rompió literalmente la química de Milwaukee), Adley Rutschman, Austin Hedges, Martín Maldonado y Andrew Miller.
  * Entraron **Manny Machado** (madurez y rol de capitán reconocido en San Diego desde 2019), **Max Muncy** (jugador de posición más longevo del núcleo de Dodgers y organizador interno del vestuario), **Matt Chapman** (líder vocal intenso en OAK/TOR/SF), **J.D. Martinez** (coach de bateo dentro del dugout que eleva a todo el lineup), **Willy Adames**, **Kevin Kiermaier**, **Brandon Nimmo**, **Gerrit Cole**, **Chris Sale**, **Nathan Eovaldi** y **Joe Musgrove**.
  * Se excluyó a **Byron Buxton** (lesiones constantes; en Twins mandaba Correa), **Shohei Ohtani** (lidera con ejemplo, no vocal), al grupo joven/emergente (Raleigh, J.P. Crawford, Ian Happ, Logan Webb) y a los *sparkplugs* de "buena vibra" (Eugenio Suárez, Teoscar Hernández, Ozzie Albies, Kiké Hernández).
  * Salieron **Brandon Belt** (broma interna de la "C" con cinta), **Pete Alonso**, **Xander Bogaerts**, **Charlie Blackmon**, **Rich Hill** y **Craig Stammen**.

**ENTRAN (11):**
```csv
machama01,BAT,Manny Machado
martijd02,BAT,J.D. Martinez
chapmma01,BAT,Matt Chapman
adamewi01,BAT,Willy Adames
kiermke01,BAT,Kevin Kiermaier
nimmobr01,BAT,Brandon Nimmo
muncyma01,BAT,Max Muncy
colege01,PIT,Gerrit Cole
salech01,PIT,Chris Sale
eovalna01,PIT,Nathan Eovaldi
musgrjo01,PIT,Joe Musgrove
```

**SALEN (6):**
```csv
beltbr01,BAT,Brandon Belt
alonspe01,BAT,Pete Alonso
bogaexa01,BAT,Xander Bogaerts
blackch02,BAT,Charlie Blackmon
hillri01,PIT,Rich Hill
stammcr01,PIT,Craig Stammen
```
