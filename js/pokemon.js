(function Pokemons() {
"use strict";

/**
 * @param {string} url
 * @returns {object} promise with response data.
 */
function getJSON(url) {

    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = function() {
            if (xhr.status == 200) { resolve(xhr.response); }
            else { reject(xhr.responseText); }
        };

        // Handle network errors
        xhr.onerror = function() {
            reject(Error("Network Error"));
        };

        xhr.send();
    });
}

/**
 * @param {string} url Address of pokemon's sprite resource according
 * to v1 of pokeapi
 * @param {object} imgElement DOM element object
 * Sets pokemon's picture.
 */
function renderSprite(url, imgElement) {

    if (!url) { return; }
    getJSON(url).then(function getSpriteUrl(response){

        let data = JSON.parse(response);
        let spriteLocation = urls.baseURL + data.image;

        imgElement.setAttribute("src", spriteLocation);
    });
}

/**
 * @param {array} types Array of objects with different types of one pokemon
 * @param {object} target Elemet object, pokemon-types-container with class
 * .${name}-types
 * Sets pokemon's types.
 */
function renderTypes(types, target/*, name*/) {

    for (let i = 0; i < types.length; i += 1) {
        let type = types[i].name;
        let p = document.createElement("p");
        target.appendChild(document.createElement("div"))
            .classList.add("pokemon-type", "type-" + type);
        target.children[i].appendChild(p); // should be .pokemon-type div
    }
}

/**
 * @param {object} response JSON data
 * Builds ordinary pokemon cards.
 */
function processPokemons(response) {

    let data = JSON.parse(response);
    let container = document.querySelector(".pokemon-cards-container");

    urls.resources.next = data.meta.next; // Set a link to next chunk of pokemos
    if (data.meta.next === null) { // Once all pokemons are displayed
        document.querySelector("#more-button").style.display = "none";
    }

    let total_count = data.meta.total_count,
        offset = data.meta.offset,
        limit = urls.settings.limit;
    urls.settings.offset = offset;
    urls.settings.total_count = total_count;

    let amountToProcess;
    if ( (total_count - offset) > limit ) {
        amountToProcess = limit;
    } else { amountToProcess = total_count - offset; } // For the last chunk

    for (let i = 0; i < amountToProcess; i += 1) {

        let spriteRes;
        // Sprite is not available
        if (!data.objects[i].sprites) {
            spriteRes = null;
        } else {
            spriteRes = urls.baseURL + data.objects[i].sprites[0].resource_uri;
        }

        let name = data.objects[i].name,
            types = data.objects[i].types; // will be an array

        // Render .pokemon-card
        container.appendChild(document.createElement("div"))
            .setAttribute("id", name);

        let currentCard = document.querySelector("#" + name);
        currentCard.classList.add("pokemon-card");

        // Render containers for sprite, name and cont. for pokemon types.
        currentCard.appendChild(document.createElement("div"))
            .classList.add("pokemon-image");
        currentCard.appendChild(document.createElement("div"))
            .classList.add("pokemon-name");
        currentCard.appendChild(document.createElement("div"))
            .classList.add("pokemon-types-container", name
                                                    .toLowerCase() + "-types");
        currentCard.childNodes[0].appendChild(document.createElement("img"))
            .classList.add(name.toLowerCase() + "-sprite");
        currentCard.childNodes[1].appendChild(document.createElement("p"))
            .classList.add(name.toLowerCase() + "-name-p");

        // Set pokemons name.
        document.querySelector("." + name.toLowerCase() + "-name-p")
            .textContent = name;

        renderSprite(spriteRes, document.querySelector( "." + name
                                                .toLowerCase() + "-sprite") );

        let typesContainer = document.querySelector("." + name
                                                    .toLowerCase() + "-types");
        renderTypes(types, typesContainer /*name*/);
    }
}

/**
 * @param {object} event DOM Event object.
 * Renders Pokemon details card
 */
function fetchDetails(event) {

    let name = event.currentTarget.id.toLowerCase(),
        url = urls.baseURL + urls.resources.pokemon,
        detailsCard = document.querySelector(".pokemon-card-detailed");

    if ( detailsCard.classList.contains("hidden") ) {
        detailsCard.classList.remove("hidden");
    }

    getJSON( url + "/" + name + "/").then( function renderDetailCard(resp) {

            let data = JSON.parse(resp);
            let nationalIdElement = document.querySelector(".pokemon-id .id");

            // Render name.
            document.querySelector(".pokemon-name .name")
                .textContent = name[0].toUpperCase() + name.slice(1);

            // Render national id.
            switch (data.national_id.toString().length) {
                case 1:
                    nationalIdElement.textContent = "#00" + data.national_id;
                    break;
                case 2:
                    nationalIdElement.textContent = "#0" + data.national_id;
                    break;
                default:
                    nationalIdElement.textContent = "#" + data.national_id;
            }

            // Set stats.
            document.querySelector("#attack").textContent = data.attack;
            document.querySelector("#defense").textContent = data.defense;
            document.querySelector("#hp").textContent = data.hp;
            document.querySelector("#sp_atk").textContent = data.sp_atk;
            document.querySelector("#sp_def").textContent = data.sp_def;
            document.querySelector("#speed").textContent = data.speed;
            document.querySelector("#weight").textContent = data.weight;
            document.querySelector("#moves").textContent = data.moves.length;

            // Render image
            let url = urls.baseURL + data.sprites[data.sprites.length - 1]
                        .resource_uri; // Load the last picture.
            renderSprite( url, document.querySelector("#sprite-details") );
        });
}

/**
 * Loads more pokemon cards based on current offset.
 */
function loadMore() {

    let url = urls.baseURL + urls.resources.next;
    getJSON(url).then(processPokemons).then(addListenersForFetchDetails);
}

let urls = {
    baseURL: "http://pokeapi.co",
    resources: {
        pokemon: "/api/v1/pokemon",
        limit: "/?limit=",
        next: ""
    },
    settings: {
        limit: 12
    }
};

let res = urls.resources,
    settings = urls.settings;
let url = urls.baseURL + res.pokemon + res.limit + settings.limit;

getJSON(url).then(processPokemons).then(addListenersForFetchDetails);

document.querySelector("#more-button").addEventListener("click", loadMore);

function addListenersForFetchDetails() {
    let pokCards = document.querySelectorAll(".pokemon-card");

    for (let card of pokCards) {
        card.addEventListener("click", fetchDetails);
    }
}
})();
