# atelier.web — curs HTML & CSS

Platformă de curs: o pagină hub + câte o pagină pentru fiecare prelegere.

## Deschidere locală

Deschide `index.html` în browser sau pornește un server din acest folder:

```bash
python -m http.server 8080
```

Apoi: [http://127.0.0.1:8080/](http://127.0.0.1:8080/)

## Structura

| # | Temă | Stare |
|---|---|---|
| 01 | Introducere în web și structura documentului HTML | disponibilă |
| 02 | HTML semantic, tabele, formulare și media | disponibilă |
| 03 | Fundamentele CSS | disponibilă |
| 04 | Modelul casetei și layout cu Flexbox și Grid | în curând |
| 05 | Poziționare, transformări, tranziții și animații | în curând |
| 06 | Adaptivitate, responsivitate și bune practici | în curând |

Programul e definit în `assets/course-data.js` (și oglindit în `course.json`). Hub-ul și banda din prelegeri citesc aceste date.

```
curs-html-css/
  index.html              ← hub-ul cursului
  assets/
    course.json           ← lista temelor (ready / soon)
    hub.css / hub.js
    course-nav.css / js   ← bandă „înapoi la curs” în prelegeri
    soon.css
  prelegeri/
    01-…/index.html
    02-…/index.html
    03-…/index.html
    04-…/index.html       ← pagină „în curând”
    05-…/
    06-…/
```

## Cum adaugi o temă nouă

1. Creezi folderul `prelegeri/0N-slug/` cu `index.html` (și `assets/` dacă e interactivă).
2. În `index.html` legi `../../assets/course-nav.css` și `../../assets/course-nav.js`.
3. În `assets/course-data.js` (și în `course.json`) pui `status: "ready"` la tema respectivă (sau o adaugi dacă e nouă).
4. Nu e nevoie de rebuild: hub-ul citește lista la încărcare.

Folderele originale din laborator (`1-introducere-web-html` etc.) rămân pe disc; acest proiect e copia de curs, pregătită pentru GitHub.
