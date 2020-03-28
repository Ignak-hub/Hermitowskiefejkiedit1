/*
 * JavaScript was copied from an official source: media.innogamescdn.com/com_DS_PL/skrypty/HermitowskieFejki.js
 * Source script unchanged. Only village coordinates for the tribe have been added to the source code.
 * The script is still legal, as no major changes have been made.
 * The script was edited by Ignak from HAPPY TREE FRIENDS
/*
 * Selecting troops and coordinates based on many factors
 * Created by: Hermitowski
 * Modified on: 13/02/2017 - version 2.2 - added targeting specific players/allies
 * Modified on: 14/02/2018 - version 2.3 - added minimum village points threshold
 * Modified on: 08/03/2018 - version 2.4 - added omitting recently selected villages for a short period of time
 * Modified on: 14/03/2018 - version 2.4 - improved performance
 * Modified on: 25/04/2018 - version 2.5 - added omitting recently selected villages in global context
 * Modified on: 26/04/2018 - version 2.5 - improved 'skip village' logic
 * Modified on: 26/04/2018 - version 2.6 - minor changes to selecting based on player/allies names
 * Modified on: 14/06/2018 - version 2.7 - added distance option
 * Modified on: 01/08/2018 - version 2.8 - added safeguard option
 * Modified on: 04/08/2018 - version 2.9 - redesign of contexts
 * Modified on: 04/08/2018 - version 2.10 - added bounding boxes
 * Modified on: 04/08/2018 - version 2.11 - added 'excludeCoords'
 * --- VERSION 3.0 ---
 * Modified on: 29/08/2018 - version 3.0a - major cleanup
 * Modified on: 03/05/2019 - blocking the selection of more than one village of the same player in local context
 * Modified on: 11/10/2019 - using new map files script
 */


function Faking() {
    const i18n = {
        DOWNLOADING_SCRIPT: 'Pobieranie skryptu... ',
        ERROR_MESSAGE: 'Komunikat o b\u{142}\u{119}dzie: ',
        FORUM_THREAD: 'Link do w\u{105}tku na forum',
        FORUM_THREAD_HREF: 'https://forum.plemiona.pl/index.php?threads/hermitowskie-fejki.125294/',
        VILLAGE_OUT_OF_GROUP: 'Wioska poza grup\u{105}. Przechodz\u{119} do nast\u{119}pnej wioski z grupy',
        MISSING_CONFIGURATION: 'Brak konfiguracji u\u{17C}ytkownika',
        BAD_SCREEN: 'Nie jeste\u{15B}  na placu',
        BLOCKED_SCREEN: 'Skrypt jest zablokowany w tym przegl\u{105}dzie',
        INSUFFICIENT_TROOPS: 'Nie uda si\u{119} wybra\u{107} wystarczaj\u{105}cej liczby jednostek',
        NO_TROOPS_SELECTED: 'Wydaje si\u{119}, \u{17C}e obecne ustawienia nie pozwalaj\u{105} na wyb\u{F3}r jednostek',
        COORDS_EMPTY: 'Pula wiosek jest pusta',
        COORDS_EMPTY_SNOBS: 'Pula wiosek le\u{17C}y poza zasi\u{119}iem szlachcic\u{F3}w',
        COORDS_EMPTY_TIME: 'Pula wiosek jest pusta z powodu wybranych ram czasowych',
        COORDS_EMPTY_CONTEXTS: 'W puli wiosek zosta\u{142}y tylko wioski, kt\u{F3}re zosta\u{142}y wybrane chwil\u{119} temu',
        NO_MORE_UNIQUE_PLAYERS: 'W puli wiosek zosta\u{142}y tylko wioski, kt\u{F3}re nale\u{17C}\u{105} do ostatnio wybranych graczy',
        ATTACK_TIME: 'Wojsko dojdzie __DAY__.__MONTH__ na __HOURS__:__MINUTES__',
        UNKNOWN_UNIT: 'Podana jednostka nie istnieje: __UNIT_NAME__',
        UNKNOWN_OPTION: 'Nieznana opcja: __PROPERTY__',
        NONEXISTENT_UNIT: 'Podana jednostka nie wyst\u{119}puje na tym \u{15B}wiecie: __UNIT_NAME__',
        INVALID_SETTINGS_SAFEGUARD: 'Ustawienia > safeguard > __UNIT_NAME__  : __VALUE__',
        INVALID_SETTINGS_TEMPLATES: 'Ustawienia > templates > __UNIT_NAME__  : __VALUE__',
        INVALID_SETTINGS_DAYS: 'Ustawienia > days > __VALUE__',
        INVALID_SETTINGS_INTERVALS: 'Ustawienia > intervals > __VALUE__',
        INVALID_SETTINGS_BOUNDING_BOXES: 'Ustawienia > boundingBoxes > __VALUE__',
    };

    UI.SuccessMessage(i18n.DOWNLOADING_SCRIPT);
    $.ajax({
        url: 'https://media.innogamescdn.com/com_DS_PL/skrypty/HermitowskiePlikiMapy.js?_=' + ~~(Date.now() / 9e6),
        dataType: 'script',
        cache: true
    }).then(() => {
        ExecuteScript();
    });

    return true;

    function ExecuteScript() {
        get_world_info({ configs: ['unit_info', 'config'] }).then(worldInfo => {
            if (worldInfo.error !== undefined) {
                // some failure getting worldInfo data, e.g. QUOTA
                throw worldInfo.error;
            }
            CreateFaker(worldInfo).init();
        }).catch(HandleError);
    }

    function HandleError(error) {
        const gui =
            `<h2>WTF - What a Terrible Failure</h2>
             <p><strong>${i18n.ERROR_MESSAGE}</strong><br/>
                <textarea rows='5' cols='42'>${error}\n\n${error.stack}</textarea><br/>
                <a href="${i18n.FORUM_THREAD_HREF}">${i18n.FORUM_THREAD}</a>
             </p>`;
        Dialog.show('scriptError', gui);
    }

    function CreateFaker(worldInfo) {
        return {
            _owner: 699198069,
            _settings: {},
            _fakeLimit: worldInfo.config.game.fake_limit,
            _defaultSettings: {
                omitNightBonus: 'true',
                coords: '477|519 478|519 479|518 482|516 479|514 477|512 476|512 473|511 471|512 471|509 469|506 467|505 466|505 460|501 462|500 498|526 499|524 498|523 495|522 496|520 496|517 496|516 493|516 488|519 487|518 483|513 485|514 486|514 489|514 493|512 499|514 499|506 493|510 491|510 492|509 488|512 485|513 465|502 465|501 466|503 467|504 468|503 467|502 467|500 477|509 477|511 481|510 441|487 443|486 445|488 445|490 446|490 446|488 453|489 455|492 456|494 456|492 455|489 454|487 459|494 460|494 462|496 462|495 463|496 464|497 469|502 469|501 470|500 471|501 472|502 473|506 472|504 477|505 477|504 479|502 480|503 479|505 479|506 482|506 482|504 484|504 485|506 484|509 485|509 486|507 487|508 487|509 487|510 487|511 489|510 490|507 489|507 488|508 492|506 493|507 493|506 490|504 500|504 500|503 499|504 498|503 497|504 495|503 494|503 499|502 498|502 497|502 497|501 503|499 502|499 500|499 500|498 499|497 502|495 501|495 504|494 504|495 505|498 505|497 501|494 497|498 496|498 495|499 493|501 492|501 493|505 493|504 474|504 473|504 473|503 489|505 491|500 490|500 486|500 484|500 483|500 481|500 479|501 477|500 478|498 475|498 475|495 472|497 471|497 481|502 480|500 479|500 466|499 467|499 469|498 469|497 469|496 503|491 502|491 502|490 502|489 501|492 501|493 500|494 500|493 499|492 500|490 499|490 498|490 499|488 500|487 504|486 507|486 508|489 509|490 509|487 510|488 511|487 511|488 510|487 510|486 512|490 512|489 513|487 514|487 517|488 517|489 517|490 519|490 516|492 515|491 514|490 513|491 513|493 512|494 520|493 517|494 517|495 517|496 516|495 515|495 516|496 516|497 515|498 514|497 518|497 516|500 517|500 515|501 515|503 515|504 516|504 518|500 518|501 518|502 518|503 518|504 511|508 511|509 510|509 510|510 514|511 514|510 514|509 516|507 515|508 515|511 507|514 502|515 502|513 503|513 500|514 501|517 506|519 506|522 507|534 506|535 509|532 511|534 516|519 515|517 513|516 513|515 517|511 519|499 519|500 519|506 520|506 519|511 518|514 518|517 520|517 520|515 522|518 521|522 520|525 519|533 522|525 523|525 523|524 523|521 495|497 496|495 496|494 493|498 493|497 491|498 490|498 488|499 485|499 482|499 467|494 469|494 471|495 472|496 473|495 473|493 472|493 471|492 468|492 472|490 472|489 473|489 472|488 475|490 476|492 477|494 478|497 478|496 479|495 479|497 480|497 456|489 455|486 456|483 455|480 459|478 458|482 459|485 460|490 462|492 463|491 465|492 466|492 465|491 466|490 481|497 482|497 483|497 484|497 485|497 486|497 487|497 490|497 490|496 488|496 492|496 502|485 504|484 507|482 511|486 512|486 512|485 513|484 514|486 515|486 516|486 517|486 516|485 515|483 513|482 511|481 510|481 509|480 503|482 502|482 501|482 498|487 497|488 496|489 475|486 474|485 474|484 476|485 478|488 478|489 478|490 481|488 480|488 479|487 479|485 479|484 476|483 476|482 474|483 474|482 473|483 470|485 468|486 469|485 466|488 465|488 466|486 467|484 469|484 464|487 480|492 479|492 480|491 481|491 481|490 482|491 482|490 481|494 481|495 482|496 483|496 484|495 482|495 482|494 483|493 494|493 493|493 493|492 494|490 493|489 490|494 487|494 484|494 484|493 487|493 488|493 498|485 498|484 499|482 498|482 497|485 496|487 495|488 521|494 521|495 523|496 524|496 525|497 525|496 526|495 526|498 526|499 527|499 526|500 523|501 521|501 524|504 523|504 522|505 521|507 521|506 524|506 524|505 525|504 526|503 530|503 532|502 532|500 532|499 528|496 528|494 529|494 530|494 531|495 532|493 529|492 527|492 525|492 526|494 524|494 525|491 527|491 528|490 527|489 528|489 529|489 529|488 520|489 519|489 519|488 520|488 519|487 523|486 523|489 524|488 528|486 527|485 525|484 523|482 527|483 528|483 529|484 531|487 531|488 531|489 530|488 533|491 532|488 532|486 530|484 529|483 528|481 525|480 524|480 523|480 523|481 522|481 522|480 521|481 520|482 520|484 521|483 518|485 517|483 518|482 519|481 520|480 517|482 516|482 522|479 526|479 523|485 524|507 525|507 527|507 527|506 527|505 532|504 533|506 534|506 533|507 532|507 536|505 536|503 536|500 535|500 535|499 542|501 539|501 539|503 540|503 539|505 537|508 535|510 534|511 533|511 532|510 531|510 530|511 531|511 531|512 529|513 529|514 530|514 531|514 530|512 529|515 530|515 530|516 531|516 535|514 537|515 538|512 529|508 530|506 524|508 525|509 523|509 523|510 525|512 526|512 525|515 526|516 527|517 526|518 526|519 525|519 525|521 525|522 525|523 527|520 529|519 531|519 531|518 530|521 531|521 536|517 536|516 538|519 540|518 541|518 544|519 545|519 541|522 539|519 539|520 538|521 538|520 535|521 540|522 540|521 541|523 542|523 544|522 545|523 545|524 545|525 543|525 542|526 543|529 543|528 546|529 541|529 538|522 534|526 533|526 534|524 535|525 537|525 538|524 538|525 539|526 539|527 537|531 537|530 539|530 538|530 540|530 541|530 542|529 539|531 540|532 539|533 539|534 536|532 534|533 530|529 530|528 531|527 530|527 529|527 529|528 527|528 528|526 535|528 529|524 541|536 536|498 534|497 533|496 534|493 535|491 536|492 536|491 536|495 536|494 537|495 545|499 547|498 548|498 549|502 550|498 550|497 549|496 548|497 547|497 546|497 546|496 547|496 548|496 552|500 553|501 553|503 552|505 552|506 551|507 551|508 551|509 552|509 550|510 550|511 549|512 548|515 551|515 551|513 551|516 551|517 548|535 545|534 548|533 550|532 550|534 550|537 548|539 525|555 526|557 525|557 524|557 552|540 553|542 553|541 555|539 556|536 553|546 555|549 557|545 557|544 557|543 557|542 561|542 562|541 565|542 566|540 566|539 567|539 569|538 571|541 573|543 575|543 574|539 577|540 566|537 558|539 558|538 556|537 557|537 555|538 554|538 558|534 559|536 560|536 553|534 555|533 559|534 557|533 561|534 560|533 562|533 551|520 549|523 548|529 556|531 557|531 555|529 556|528 557|528 557|529 559|531 559|529 560|531 560|530 561|533 562|532 565|534 565|533 606|562 606|559 605|557 611|559 617|560 629|557 617|556 620|552 617|551 614|551 610|550 613|549 612|549 610|547 613|548 617|548 615|549 618|550 613|544 614|544 614|545 616|547 615|546 610|544 604|544 603|544 608|544 607|542 607|541 609|542 610|542 599|539 599|537 570|530 565|531 563|531 562|530 562|529 564|529 564|530 566|529 565|527 565|525 566|525 567|526 567|527 561|527 560|527 559|528 558|527 558|526 556|524 556|523 556|522 555|522 553|522 553|521 554|519 552|511 553|511 552|515 552|516 553|516 553|514 554|514 554|515 554|518 554|517 556|517 556|519 556|520 556|521 555|520 557|521 557|522 558|522 557|520 557|517 557|516 556|514 555|513 554|511 554|510 553|507 554|505 555|508 555|509 557|512 559|512 558|512 558|514 559|516 558|516 558|517 559|518 559|517 560|519 561|519 561|518 561|516 560|515 561|513 561|521 560|521 558|520 559|525 560|525 560|523 559|523 561|523 561|524 562|524 563|524 564|524 565|524 565|523 562|522 565|522 566|524 566|523 567|523 568|524 571|528 570|528 571|529 569|524 569|523 570|524 571|527 572|527 572|526 573|526 573|527 573|528 573|529 576|527 576|525 577|525 577|524 581|523 583|526 582|526 582|524 584|525 584|524 585|525 585|526 587|525 587|523 585|523 591|534 591|532 591|530 591|529 590|529 572|524 570|523 568|523 567|524 567|525 564|521 565|521 566|521 567|522 567|521 569|522 570|522 571|522 572|523 572|522 573|523 574|524 578|522 579|522 580|521 580|520 576|522 575|521 574|523 573|522 573|521 574|520 573|520 575|520 576|519 578|518 580|518 581|518 582|518 584|521 586|522 587|521 586|520 585|519 589|526 589|525 591|527 591|526 592|528 592|529 592|527 592|526 592|525 593|529 593|528 593|531 593|533 594|531 594|530 595|531 596|530 595|535 595|538 593|537 598|536 596|537 596|538 597|539 598|538 600|537 602|541 603|539 604|540 604|539 605|539 605|538 605|537 604|536 603|535 603|534 604|535 605|535 606|536 606|537 607|536 603|532 600|534 599|535 598|535 597|534 595|534 596|533 597|533 599|533 599|532 600|532 599|531 598|531 600|530 601|530 599|529 603|529 603|528 603|527 605|531 605|530 605|529 606|529 604|532 605|533 607|533 608|531 608|530 609|530 609|531 609|532 609|535 609|534 609|536 607|535 608|538 607|539 612|543 612|542 612|541 613|543 613|542 615|543 615|542 615|541 614|541 615|540 613|540 611|539 610|539 610|540 609|539 618|543 621|542 620|540 621|540 618|538 618|537 617|536 616|537 616|539 615|537 612|537 613|536 613|535 615|534 615|535 616|534 616|533 615|533 615|532 613|532 612|533 611|533 612|530 611|530 611|529 610|529 612|528 612|527 612|526 613|527 615|528 615|529 616|529 617|529 618|530 617|528 616|531 620|534 623|536 625|536 624|540 626|539 628|542 628|545 635|543 633|537 638|536 633|533 635|532 635|528 638|528 632|526 629|528 627|527 628|525 623|527 630|533 630|532 595|528 594|527 593|526 594|526 595|525 596|526 597|526 597|525 597|524 599|524 599|525 600|527 603|526 603|525 604|525 607|526 607|527 608|526 609|526 608|525 607|525 611|523 610|522 610|521 608|523 607|523 606|524 605|524 603|524 602|524 593|523 590|524 590|523 589|523 590|522 591|522 591|521 590|521 590|520 591|520 592|520 593|522 594|521 595|521 596|522 603|523 604|523 604|522 605|522 606|522 614|524 615|526 613|520 615|519 612|519 621|525 620|521 542|495',
                // players: '',
                days: '1-31',
                intervals: '0:00-23:59',
                templates: [
                    { spy: 1, ram: 1 },
                    { spy: 1, catapult: 1 },
                    { ram: 1 },
                    { catapult: 1 }
                ],
                fillWith: 'spear,sword,axe,archer,spy,light,marcher,heavy,ram,catapult',
                fillExact: 'false',
                skipVillages: 'true',
                safeguard: {},
                // localContext: '0',
                // customContexts: '',
                // boundingBoxes: [],
                // targetUniquePlayers: false
            },
            _localContextKey: `HermitowskieFejki_${game_data.village.id}`,
            _cache_control_key: `HermitowskieFejki_CacheControl`,
            _now: Date.now(),
            init: function () {
                try {
                    this.checkConfig();
                    this.invalidateCache();
                    this.checkScreen();
                    let troops = this.selectTroops();
                    let target = this.selectTarget(troops);
                    this.displayTargetInfo(troops, target);
                } catch (err) {
                    UI.ErrorMessage(err, '1e3');
                }
            },
            checkConfig: function () {
                if (typeof (HermitowskieFejki) === 'undefined')
                    throw i18n.MISSING_CONFIGURATION;
                this._fixConfig(HermitowskieFejki);
            },
            invalidateCache() {
                let cacheControl = this._getCacheControl();
                for (const key in cacheControl) {
                    if (cacheControl.hasOwnProperty(key)) {
                        if (cacheControl[key] < this._now) {
                            let timestamp = this._invalidateItem(key);
                            if (timestamp === 0) {
                                delete cacheControl[key];
                            }
                            else {
                                cacheControl[key] = timestamp;
                            }
                        }
                    }
                }
                localStorage.setItem(this._cache_control_key, JSON.stringify(cacheControl));
            },
            checkScreen: function () {
                if ($('.jump_link').length) {
                    this.goToNextVillage(i18n.VILLAGE_OUT_OF_GROUP);
                }
                if (game_data.screen !== 'place' || $('#command-data-form').length !== 1) {
                    location = TribalWars.buildURL('GET', 'place', { mode: 'command' });
                    throw i18n.BAD_SCREEN;
                }
                // disable executing script on screen with command confirmation
                if ($('#troop_confirm_go').length !== 0) {
                    throw i18n.BLOCKED_SCREEN;
                }
            },
            goToNextVillage: function (message) {
                if (this._toBoolean(this._settings.skipVillages)) {
                    let switchRight = $('#village_switch_right')[0];
                    let jumpLink = $('.jump_link')[0];
                    if (switchRight) {
                        location = switchRight.href;
                    }
                    else if (jumpLink) {
                        location = jumpLink.href;
                    }
                }
                throw message;
            },
            selectTroops: function () {
                this._clearPlace();
                let place = this._getAvailableUnits();

                for (let template of this._settings.templates) {
                    this._validateTemplate(template);
                    if (this._isEnough(template, place)) {
                        if (this._fill(template, place)) {
                            return template;
                        }
                    }
                }
                this.goToNextVillage(i18n.INSUFFICIENT_TROOPS);
            },
            selectTarget: function (troops) {
                let slowest = this._slowestUnit(troops);
                let poll = this._sanitizeCoordinates(this._settings.coords);
                // poll = this._targeting(poll);
                poll = this._removeUnreachableVillages(poll, troops, slowest);
                // poll = this._applyLocalContext(poll);
                //poll = this._applyCustomContexts(poll);
                poll = this._targetUniquePlayers(poll);
                return this._selectCoordinates(poll);
            },
            displayTargetInfo: function (troops, target) {
                let defaultTargetInput = $('.target-input-field');
                if (defaultTargetInput.length === 1) {
                    defaultTargetInput.val(target);
                }
                else { // mobile devices
                    $('#inputx').val(target.split('|')[0]);
                    $('#inputy').val(target.split('|')[1]);
                }
                this._selectUnits(troops);
                let arrivalTime = this._calculateArrivalTime(target, this._slowestUnit(troops));
                let attack_time = i18n.ATTACK_TIME
                    .replace('__DAY__', this._twoDigitNumber(arrivalTime.getDate()))
                    .replace('__MONTH__', this._twoDigitNumber(arrivalTime.getMonth() + 1))
                    .replace('__HOURS__', this._twoDigitNumber(arrivalTime.getHours()))
                    .replace('__MINUTES__', this._twoDigitNumber(arrivalTime.getMinutes()));
                UI.SuccessMessage(attack_time);
            },
            _removeUnreachableVillages: function (poll, troops, slowest) {
                if (troops.hasOwnProperty('snob') && Number(troops.snob) > 0) {
                    let max_dist = Number(worldInfo.config.snob.max_dist);
                    poll = poll.filter(coords =>
                        this._calculateDistanceTo(coords) <= max_dist
                    );
                    if (poll.length === 0) {
                        this.goToNextVillage(i18n.COORDS_EMPTY_SNOBS);
                    }
                }

                poll = poll.filter(coordinates =>
                    this._checkConstraints(this._calculateArrivalTime(coordinates, slowest))
                );
                if (poll.length === 0) {
                    this.goToNextVillage(i18n.COORDS_EMPTY_TIME);
                }

                return poll;
            },
            _invalidateItem: function (key) {
                let items = localStorage.getItem(key);
                items = JSON.parse(items);
                items = items.filter(item => item[1] > this._now);
                if (items.length === 0) {
                    localStorage.removeItem(key);
                    return 0;
                }
                localStorage.setItem(key, JSON.stringify(items));
                return Math.min(...items.map(item => item[1]));
            },
            _twoDigitNumber: function (number) {
                return `${Number(number) < 10 ? '0' : ''}${number}`;
            },
            _sanitizeCoordinates: function (coordinates) {
                let coordsRegex = new RegExp(/\d{1,3}\|\d{1,3}/g);
                let match = coordinates.match(coordsRegex);
                return match == null
                    ? []
                    : match;
            },
            _checkConstraints: function (arrivalTime) {
                let daysIntervals = this._settings.days.split(',');
                /* daysIntervals: ['1-23','23-30'], */
                let hoursIntervals = this._settings.intervals.split(',');
                /* hoursIntervals: ['7:00-8:00','23:00-23:59'], */
                if (this._isInInterval(arrivalTime, daysIntervals, this._parseDailyDate) === false) {
                    return false;
                }
                if (this._toBoolean(this._settings.omitNightBonus) && this._isInNightBonus(arrivalTime)) {
                    return false;
                }
                return this._isInInterval(arrivalTime, hoursIntervals, this._parseTime);
            },
            _isInNightBonus: function (arrivalTime) {
                if (!worldInfo.config.night.active) {
                    return false;
                }
                let timeInterval = [
                    `${worldInfo.config.night.start_hour}:00-${worldInfo.config.night.end_hour}:00`
                ];
                return this._isInInterval(arrivalTime, timeInterval, this._parseTime);
            },
            _selectCoordinates: function (poll) {
                let target = poll[Math.floor(Math.random() * poll.length)];
                // this._save(target);
                return target;
            },
            _clearPlace: function () {
                $('[id^=unit_input_]').val('');
                let defaultTargetInput = $('.target-input-field');

                if (defaultTargetInput.length === 1) {
                    defaultTargetInput.val('');
                }
                else { // mobile devices
                    $('#inputy').val('');
                    $('#inputx').val('');
                }
            },
            _selectUnit: function (unitName, unitCount) {
                if (worldInfo.unit_info.hasOwnProperty(unitName) === false) {
                    throw i18n.UNKNOWN_UNIT.replace('__UNIT_NAME__', unitName);
                }
                let input = this._getInput(unitName);
                let maxUnitCount = Number(input.attr('data-all-count'));
                let selectedUnitCount = Number(input.val());
                unitCount = Math.min(maxUnitCount, selectedUnitCount + unitCount);
                input.val(unitCount === 0 ? '' : unitCount);
            },
            _selectUnits: function (units) {
                for (const unitName in units) {
                    if (units.hasOwnProperty(unitName))
                        this._selectUnit(unitName, units[unitName]);
                }
            },
            _countPopulations: function (units) {
                let sum = 0;
                for (const unitName in units) {
                    if (units.hasOwnProperty(unitName)) {
                        let pop = Number(worldInfo.unit_info[unitName].pop);
                        let quantity = units[unitName];
                        sum += pop * quantity;
                    }
                }
                return sum;
            },
            _getFillTable: function () {
                let entries = this._settings.fillWith.split(',');
                let fillTable = [];
                for (const entry of entries) {
                    let name = entry;
                    let quantity = 1e9;
                    if (name.indexOf(':') !== -1) {
                        let parts = entry.split(':');
                        name = parts[0];
                        quantity = Number(parts[1]);
                    }
                    name = name.trim();
                    fillTable.push([name, quantity]);
                }
                return fillTable;
            },
            _fill: function (template, place) {
                let left = Math.floor(game_data.village.points * Number(this._fakeLimit) * 0.01);
                left -= this._countPopulations(template);
                if ((left <= 0 || !this._shouldApplyFakeLimit(template)) && !this._toBoolean(this._settings.fillExact)) {
                    return true;
                }
                let fillTable = this._getFillTable();
                for (const entry of fillTable) {
                    let name = entry[0];
                    if (!worldInfo.unit_info.hasOwnProperty(name)) continue;
                    let minimum = entry[1];
                    let pop = Number(worldInfo.unit_info[name].pop);
                    if (!this._toBoolean(this._settings.fillExact)) {
                        if (name === 'spy' &&
                            game_data.units.filter(unit => unit !== 'spy').every(unit => Number(template[unit]) > 0)) {
                            let spies = (template['spy']) ? Number(template['spy']) : 0;
                            minimum = Math.min(minimum, Math.ceil(left / pop), 5 - spies);
                        } else {
                            minimum = Math.min(minimum, Math.ceil(left / pop));
                        }
                    }
                    let selected = 0;
                    if (!!template[name]) {
                        selected = template[name];
                    }
                    minimum = Math.min(place[name] - selected, minimum);
                    if (!template[name]) {
                        template[name] = minimum;
                    }
                    else {
                        template[name] += minimum;
                    }
                    left -= minimum * pop;
                    if ((left <= 0 || !this._shouldApplyFakeLimit(template)) && !this._toBoolean(this._settings.fillExact)) {
                        break;
                    }
                }
                return left <= 0 || !this._shouldApplyFakeLimit(template);
            },
            _slowestUnit: function (units) {
                let speed = 0;
                for (const unitName in units) {
                    if (units.hasOwnProperty(unitName) && units[unitName] !== 0) {
                        speed = Math.max(Number(worldInfo.unit_info[unitName].speed), speed);
                    }
                }
                if (speed === 0) {
                    throw i18n.NO_TROOPS_SELECTED;
                }
                return speed;
            },
            _fixConfig: function (userConfig) {
                // check if user have only valid settings

                for (let property in userConfig) {
                    if (!this._defaultSettings.hasOwnProperty(property)) {
                        throw i18n.UNKNOWN_OPTION.replace('__PROPERTY__', property);
                    }
                }

                // overwrite default values with user defined
                for (let property in this._defaultSettings) {
                    if (this._defaultSettings.hasOwnProperty(property)) {
                        this._settings[property] = JSON.parse(JSON.stringify(
                            (userConfig[property] === undefined)
                                ? this._defaultSettings[property]
                                : userConfig[property]
                        ));
                    }
                }
            },
            _toBoolean: function (input) {
                if (typeof (input) === 'boolean') {
                    return input;
                }
                if (typeof (input) === 'string') {
                    return input.trim().toLowerCase() === 'true';
                }
                return false;
            },
            _calculateDistanceTo: function (target) {
                let dx = game_data.village.x - Number(target.split('|')[0]);
                let dy = game_data.village.y - Number(target.split('|')[1]);
                return Math.hypot(dx, dy);
            },
            _calculateArrivalTime: function (coordinates, slowestUnitSpeed) {
                let distance = this._calculateDistanceTo(coordinates);
                let timePerField = slowestUnitSpeed * 60 * 1000;
                return new Date(distance * timePerField + this._now);
            },
            _getInput: function (unitName) {
                let input = $(`#unit_input_${unitName}`);
                if (input.length === 0) {
                    throw i18n.NONEXISTENT_UNIT.replace('__UNIT_NAME__', unitName);
                }
                return input;
            },
            _isInInterval: function (value, intervals, predicate) {
                for (let i = 0; i < intervals.length; i++) {
                    if (predicate(value, intervals[i])) {
                        return true;
                    }
                }
                return false;
            },
            _parseDailyDate: function (value, interval) {
                let error = i18n.INVALID_SETTINGS_DAYS
                    .replace('__VALUE__', interval);
                let day = value.getDate();
                let range = interval.split('-');
                if (range.length !== 2) {
                    throw error;
                }
                let minDay = Number(range[0]);
                let maxDay = Number(range[1]);
                if (isNaN(minDay) || isNaN(maxDay)) {
                    throw error;
                }
                return minDay <= day && day <= maxDay;
            },
            _parseTime: function (value, interval) {
                let error = i18n.INVALID_SETTINGS_INTERVALS
                    .replace('__VALUE__', interval);
                let convertTimeToMinutes = time => {
                    let parts = time.split(':');
                    if (parts.length !== 2) {
                        throw error;
                    }
                    let hours = Number(parts[0]);
                    let minutes = Number(parts[1]);
                    if (isNaN(hours) || isNaN(minutes)) {
                        throw error;
                    }
                    return hours * 60 + minutes;
                };
                let minutes = value.getHours() * 60 + value.getMinutes();
                let range = interval.split('-');
                if (range.length !== 2) {
                    throw error;
                }
                return convertTimeToMinutes(range[0]) <= minutes && minutes <= convertTimeToMinutes(range[1]);
            },
            _getAvailableUnits: function () {
                let units = game_data.units.filter(unit => unit !== 'militia');
                let available = {};
                for (let unit of units) {
                    available[unit] = Number(this._getInput(unit).attr('data-all-count'));
                    if (this._settings.safeguard.hasOwnProperty(unit)) {
                        let threshold = Number(this._settings.safeguard[unit]);
                        if (isNaN(threshold) || threshold < 0) {
                            throw i18n.INVALID_SETTINGS_SAFEGUARD
                                .replace('__UNIT_NAME__', unit)
                                .replace('__VALUE__', this._settings.safeguard[unit]);
                        }
                        available[unit] = Math.max(0, available[unit] - threshold);
                    }
                }
                return available;
            },
            _isEnough: function (template, placeUnits) {
                for (let unit in template) {
                    if (template.hasOwnProperty(unit)) {
                        if (!worldInfo.unit_info.hasOwnProperty(unit) || template[unit] > placeUnits[unit])
                            return false;
                    }
                }
                return true;
            },
            _omitEmptyAndToLower: function (collection) {
                return collection
                    .map(name => name.trim())
                    .filter(name => name.length !== 0)
                    .map(name => name.toLowerCase());
            },
            _targeting: function (poll) {
                return poll;
                let players = this._omitEmptyAndToLower(this._settings.players.split(','));

                if (players.length === 0) {
                    return poll;
                }

                let playerIds = worldInfo.player.filter(p =>
                    players.some(target => target === p.name.toLowerCase())
                ).map(p => p.id);

                let villages = worldInfo.village.filter(v =>
                    playerIds.some(target => target === v.playerId)
                ).map(v => v.coords);

                villages = this._applyBoundingBoxes(villages);

                poll = [... new Set([...poll, ...villages])];
                if (poll.length === 0) {
                    this.goToNextVillage(i18n.COORDS_EMPTY);
                }
                return poll;
            },
            _save: function (coords) {
                this._saveEntry(coords, this._localContextKey, Number(this._settings.localContext));
                // let customContexts = this._getCustomContexts();
                // for (let customContext of customContexts) {
                //     this._saveEntry(coords, customContext.key, customContext.liveTime);
                // }
            },
            _saveEntry: function (coords, key, liveTime) {
                if (isNaN(liveTime)) {
                    return;
                }
                let expirationTime = this._now + liveTime * 60 * 1000;
                let recent = localStorage[key];
                recent = recent === undefined ? [] : JSON.parse(recent);
                recent.push([coords, expirationTime]);
                localStorage[key] = JSON.stringify(recent);
                this._updateCacheControl(key, expirationTime);
            },
            _updateCacheControl: function (key, expirationTime) {
                let cacheControl = this._getCacheControl();
                if (!cacheControl.hasOwnProperty(key) || cacheControl[key] > expirationTime) {
                    cacheControl[key] = expirationTime;
                    localStorage.setItem(this._cache_control_key, JSON.stringify(cacheControl));
                }
            },
            _getCacheControl: function () {
                let cacheControl = localStorage.getItem(this._cache_control_key);
                if (cacheControl == null) {
                    return {};
                }
                return JSON.parse(cacheControl);
            },
            _getCustomContexts: function () {
                return this._settings.customContexts.split(',')
                    .filter(value => value.length !== 0)
                    .map(entry => entry.split(":"))
                    .map(entry => {
                        return {
                            key: `HermitowskieFejki_${entry[0].trim()}`,
                            liveTime: Number(entry[1]),
                            countThreshold: entry.length == 2 ? 1 : Number(entry[2])
                        }
                    });
            },
            _applyLocalContext: function (poll) {
                let entry = typeof (this._settings.localContext) === 'string'
                    ? this._settings.localContext.split(':')
                    : [this._settings.localContext];
                poll = this._omitRecentlySelectedCoords(poll, {
                    key: this._localContextKey,
                    liveTime: Number(entry[0]),
                    countThreshold: entry.length == 1 ? 1 : Number(entry[1])
                });
                if (poll.length === 0) {
                    this.goToNextVillage(i18n.COORDS_EMPTY_CONTEXTS);
                }
                return poll;
            },
            _applyCustomContexts: function (poll) {
                let customContexts = this._getCustomContexts();
                for (let customContext of customContexts) {
                    poll = this._omitRecentlySelectedCoords(poll, customContext);
                }
                if (poll.length === 0) {
                    this.goToNextVillage(i18n.COORDS_EMPTY_CONTEXTS);
                }
                return poll;
            },
            _omitRecentlySelectedCoords: function (poll, context) {
                let coords = localStorage.getItem(context.key);
                if (coords === null) {
                    return poll;
                }
                coords = JSON.parse(coords);
                coords = this._filterCoordsByCount(coords.map(entry => entry[0]), context.countThreshold)
                return this._exclude(poll, coords);
            },
            _filterCoordsByCount: function (coords, countThreshold) {
                let map = new Map();
                for (const village of coords) {
                    if (map.has(village)) {
                        map.set(village, 1 + map.get(village));
                    }
                    else {
                        map.set(village, 1);
                    }
                }
                let result = [];
                map.forEach((count, village) => {
                    if (count < countThreshold) {
                        result.push(village);
                    }
                });
                return result;
            },
            _targetUniquePlayers: function (poll) {
                if (!this._settings.targetUniquePlayers) {
                    return poll;
                }

                let recentVillages = localStorage.getItem(this._localContextKey);

                if (recentVillages == null) {
                    return poll;
                }

                recentVillages = JSON.parse(recentVillages);

                const coords2village = new Map(worldInfo.village.map(x => [x.coords, x]));
                const recentPlayerIds = new Set([
                    ...recentVillages.map(v => coords2village.get(v[0]))
                        .filter(x => x)
                        .map(x => x.playerId)
                ]);

                poll = poll.map(x => coords2village.get(x))
                    .filter(x => x)
                    .filter(x => !recentPlayerIds.has(x.playerId))
                    .map(x => x.coords);

                if (poll.length === 0) {
                    throw i18n.NO_MORE_UNIQUE_PLAYERS;
                }
                return poll;
            },
            _exclude: function (poll, excluded) {
                let banned = new Set([...excluded]);
                return poll.filter(pollCoords => !banned.has(pollCoords));
            },
            _applyBoundingBoxes: function (poll) {
                if (this._settings.boundingBoxes.length === 0) {
                    return poll;
                }

                for (const boundingBox of this._settings.boundingBoxes) {
                    this._validateBoundingBox(boundingBox);
                }

                let coords = poll.map(c => {
                    let parts = c.split('|');
                    return {
                        x: Number(parts[0]),
                        y: Number(parts[1])
                    }
                });

                coords = coords.filter(c => {
                    return this._settings.boundingBoxes.some(boundingBox => {
                        return (boundingBox.minX <= c.x && c.x <= boundingBox.maxX) &&
                            (boundingBox.minY <= c.y && c.y <= boundingBox.maxY);
                    });
                });
                return coords.map(c => `${c.x}|${c.y}`);
            },
            _shouldApplyFakeLimit: function (units) {
                return game_data.units.filter(unit => unit !== 'spy').some(unit => Number(units[unit]) > 0) || units['spy'] < 5;
            },
            _validateTemplate(template) {
                for (const unit in template) {
                    if (template.hasOwnProperty(unit)) {
                        let count = Number(template[unit]);
                        if (!worldInfo.unit_info.hasOwnProperty(unit) || isNaN(count) || count < 0) {
                            throw i18n.INVALID_SETTINGS_TEMPLATES
                                .replace('__UNIT_NAME__', unit)
                                .replace('__VALUE__', template[unit]);
                        }
                    }
                }
            },
            _validateBoundingBox(boundingBox) {
                const properties = ['minX', 'maxX', 'minY', 'maxY'];
                for (const property in boundingBox) {
                    if (boundingBox.hasOwnProperty(property)) {
                        let boundary = Number(boundingBox[property]);
                        if (properties.indexOf(property) === -1 || isNaN(boundary)) {
                            throw i18n.INVALID_SETTINGS_BOUNDING_BOXES
                                .replace('__VALUE__', JSON.stringify(boundingBox));
                        }
                        boundingBox[property] = boundary; // just in case of number literal

                    }
                }
            },
        };
    }
}

Faking();
