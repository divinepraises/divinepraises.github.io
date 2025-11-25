# divinepraises.github.io website

To pray the office, please visit [the website](https://divinepraises.github.io/). This page is for contributing.

The project is in the development stages, so there is much work to do. If you want to join, contact us (or create an issue here).

Some of the texts here might be copyrighted. We lay no claim on the texts, and if you are the rights owner and want them removed, we'll gladly oblige. All the sources are indicated in the `about.html` file.

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
  - "Vigil of Our Lord or Our Lady": 12
- name: name of the saint
- type: type of the saint. Used for deducing common troparia. If an empty string, no troparion will be used (useful for feasts of the Lord or for compline-only saints) 

It can also include fields:
- troparia. If not provided, constructed from "type" and "name".
- kontakia. If not provided, constructed from "type" and "name".
- TheotokosDismissal: a part of a dismissal for a feast of Our Lady. Sould not be provided, unless required.
- saint: (so that we can include Blesseds). If not provided, a default value is used (Saint)
- day name: a more elaborate name of the day (e.g. dedication of the church of st George). If not provided, constructed from "type" and "name"
- fields for liturgy