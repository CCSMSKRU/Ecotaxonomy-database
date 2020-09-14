var text = `@article{auge1993nonluoghi,
                title={Nonluoghi},
                author={Aug{\'e}, Marc},
                journal={Introduzione a una antropologia della surmodernit{\`a}},
              volume={1},
              pages={111},
              year={1993}
            }`;

function bibToApa(text) {

    var authors = /author\=\{([^}]+)\}/g.exec(text);
    var year = /year\=\{([^}]+)\}/g.exec(text);
    var title = /title\=\{([^}]+)\}/g.exec(text);
    var journal = /journal\=\{([^}]+)\}/g.exec(text);
    var volume = /volume\=\{([^}]+)\}/g.exec(text);
    var number = /number\=\{([^}]+)\}/g.exec(text);
    var pages = /pages\=\{([^}]+)\}/g.exec(text);

    // newAuthors = authors[1].replace(/^(.*) and (.*?)$/, %27 $1&$2%27);
    // newAuthors = newAuthors.replace(/ and /g, % 27,% 27);
    // newTitle = title[1].replace(/\{/g, % 27 % 27);
    // newPages = pages[1].replace(/\-\-/g, % 27 - % 27).replace(/\\/g, % 27 % 27);
    // newJournal = journal[1].replace(/\\/g, % 27 % 27).replace(/\&amp\;/g, % 27 & % 27);
    // newJournal = newJournal.replace(/(^|\s)([a-z])/g, function (m, p1, p2) {
    //     return p1 + p2.toUpperCase();
    // });
    //
    // newNumber =%27 % 27;
    // if (number) {
    //     newNumber = "(" + number[1] + ")";
    // }
    console.log(authors, year, title, journal, volume, number, pages);

    // apaFormat = newAuthors + " (" + year[1] + "). " + newTitle + ". " + newJournal + ", " + volume[1] + newNumber + ", " + newPages + ".";
    //
    // return apaFormat;
}

console.log(bibToApa(text));