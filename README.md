# divinepraises.github.io website

To pray the office, please visit [the website](https://divinepraises.github.io/). This page is for contributing.

##  Disclaimer

Some of the texts here might be copyrighted. We lay no claim on the texts, and if you are the rights owner and want them removed, we'll gladly oblige. All the sources are indicated in the `about.html` file.

## Contribution guidelines

The project is in the development stages, so there is much work to do. If you want to join, contact us or check out [this Issue](https://github.com/divinepraises/divinepraises.github.io/issues/1) and choose a task to work on.

You might need a GitHub account -- getting one can be handled in the top right corner of this web page. The contributiuons are to be done via [pull requests](https://docs.github.com/en/pull-requests).

### Small changes

For small changes like correcting typos you can find a relevant file in the navigator above and edit it from the browser. Then the system will guide you through creation of a pull request.

### Launching a local version of the web-site at your computer

You'd need Python installed on your computer. Then open command line and type
```
cd FOLDER_WHERE_THE_PROJECT_FILES_ARE
python -m http.server 8000
```
Then open `http://localhost:8000/main.html` in your browser.

To stop local server, just type `ctrl+C` in the command line window where you launched it.

## Formatting of a menaion day

It must include following fields

- class: a number representing the rank of the day in a custom system of this site:
  - "Alleluia day": 3, 
  - "Saint of 4 stychera": 4,
  - "Two saints of 4": 5,
  - "Saint of 6 stychera": 6,
  - "Great doxology": 7,
  - "Polyeleos": 8,
  - "Vigil": 10,
  - "Vigil of Our Lady": 11
  - "Vigil of Our Lord": 12
- name: name of the saint
- type: type of the saint. Used for deducing common troparia. If an empty string, no troparion will be used (useful for feasts of the Lord or for compline-only saints) 

It can also include fields:
- troparia. If not provided, constructed from "type" and "name".
- kontakia. If not provided, constructed from "type" and "name".
- forefeast: a feast a forefeast of which we are celebrating.
- postfeast: a feast a postfeast of which we are celebrating.
- specialDismissal: a part of a dismissal for a feast of Our Lord. Should not be provided, unless required.
- TheotokosDismissal: a part of a dismissal for a feast of Our Lady. Should not be provided, unless required.
- saint: (so that we can include Blesseds). If not provided, a default value is used (Saint)
- day name: a more elaborate name of the day (e.g. dedication of the church of st George). If not provided, constructed from "type" and "name"
- fields for liturgy
