let pokemonList = [],
  cardsContainer = document.querySelector("#cards-container");

let count = 0,
  cardIndex = 1;

const cardHead = (name) => {
  const head = document.createElement("div"),
    title = document.createElement("span");

  head.classList.add("card-head");
  title.classList.add("card-title");
  let name2 = name.charAt(0).toUpperCase() + name.slice(1);
  title.innerText = name2;

  head.appendChild(title);
  return head;
};
const cardImg = (url) => {
  const sprite = document.createElement("div"),
    img = document.createElement("img");

  img.setAttribute("src", url);
  sprite.classList.add("card-img");

  sprite.appendChild(img);
  return sprite;
};
const cardBody = (ab, ef) => {
  const body = document.createElement("div"),
    abP = document.createElement("p"),
    abE = document.createElement("p");

  let ab2 = ab.charAt(0).toUpperCase() + ab.slice(1);
  abP.innerText = ab2;
  abP.classList.add("poke-ability");
  abE.innerText = ef;
  abE.classList.add("poke-effect");

  [abP, abE].forEach((elm) => body.appendChild(elm));

  body.classList.add("card-body");

  return body;
};
const cardFoot = (count) => {
  const foot = document.createElement("div"),
    span1 = document.createElement("span"),
    span2 = document.createElement("span");

  span1.innerText = `${count}/151`;
  span2.innerHTML = `By <a href="https://thehelpfultipper.com/" target="_blank" rel="noopener">THT</a>`;
  span2.classList.add("creator");

  [span1, span2].forEach((elm) => foot.appendChild(elm));

  foot.classList.add("card-foot");

  return foot;
};

const createCard = (pokemon, count) => {
  let { pokeName, ability, effect, img } = pokemon;

  const card = document.createElement("div"),
    head = cardHead(pokeName),
    pokeimg = cardImg(img),
    body = cardBody(ability, effect),
    foot = cardFoot(count);

  card.classList.add("card", "no-show");

  [head, pokeimg, body, foot].forEach((elm) => card.appendChild(elm));

  cardsContainer.appendChild(card);
};

const showCards = (n) => {
  let cards = document.querySelectorAll(".card");
  n > cards.length && (cardIndex = 1);
  n < 1 && (cardIndex = cards.length);
  for (let i = 0; i < pokemonList.length; i++) {
    cards[i].style.display = "none";
  }
  cards[cardIndex - 1].style.display = "block";
};

const nextCard = (n) => {
  // n >> increment
  showCards((cardIndex += n));
};

const loader = (isLoad = true, mssg = "Loading") => {
  if (!isLoad) {
    document.querySelector(".loading-animation").style.display = "none";
    return;
  } else {
    const loadMod = document.querySelector(".load-mssg");
    document.querySelector(".loading-animation").style.display = "block";
    loadMod.innerText = mssg;
  }
};

const fetchPokeData = async (pokemon) => {
  loader((isLoad = true), (mssg = "Fetching Pokémon"));
  const response = await fetch(pokemon.url);
  const data = response.json();
  loader((isLoad = false));
  return data;
};

const fetchPokeAbility = async (id) => {
  const response = await fetch(`https://pokeapi.co/api/v2/ability/${id}/`);
  const data = response.json();
  return data;
};

const fetchPokemon = async () => {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
  const data = await response.json();
  return data;
};

(async () => {
  const getPokemon = await fetchPokemon();
  // console.log(getPokemon) { results: [{}]}

  for (let poke of getPokemon.results) {
    let pokeDetails = await fetchPokeData(poke);
    let {
      id,
      name: pokeName,
      abilities: [
        {
          ability: { name: ability }
        }
      ],
      sprites: {
        other: {
          "official-artwork": { front_default: img }
        }
      }
    } = pokeDetails;

    let pokeAbility = await fetchPokeAbility(id);
    let { effect_entries: effects } = pokeAbility;
    let effect;
    effects.forEach((ef) => {
      ef.language.name === "en" && (effect = ef.short_effect);
    });

    pokemonList.push({
      pokeName,
      ability,
      effect,
      img
    });
  }

  // build pokemon cards for display
  pokemonList.forEach((poke, count) => {
    count++;
    createCard(poke, count);
  });

  // display card
  showCards(cardIndex);

  /*
   * Navigate among cards in deck
   * using screen size to determine type of control
   */

  // button navigation
  let buttons = document.querySelectorAll("svg");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.contains("svg-right") && nextCard(1);
      btn.classList.contains("svg-left") && nextCard(-1);
    });
  });

  // touch/scroll navigation
  if (window.innerWidth < 600) {
    let scrollTimeout,
      isScrolling = false,
      startX = 0,
      endX = 0,
      dotIndex = 1;

    // Dot navigation
    const activeIndicator = (n) => {
      // n = dotIndex plus increment
      let dots = document.querySelectorAll(".dot");

      n > dots.length && (dotIndex = 1);
      n < 1 && (dotIndex = dots.length);

      for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active");
      }

      dots[dotIndex - 1].classList.add("active");
    };

    const nextIndicator = (inc) => {
      activeIndicator((dotIndex += inc));
    };

    // Mouse/touch navigation
    const touchStart = (event) => {
      if (event.type === "touchstart") {
        startX = event.changedTouches[0].clientX;
      } else if (event.type === "mousedown") {
        startX = event.clientX;
      }
    };

    const touchEnd = (event) => {
      if (event.type === "touchend") {
        endX = event.changedTouches[0].clientX;
      } else if (event.type === "mouseup") {
        endX = event.clientX;
      }

      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 10; // Adjust the threshold as needed

      const swipeDistance = endX - startX;

      if (-swipeDistance > swipeThreshold) {
        // Swiped to the right (next card)
        nextCard(1);
        nextIndicator(1);
      } else if (-swipeDistance < swipeThreshold) {
        // Swiped to the left (previous card)
        nextCard(-1);
        nextIndicator(-1);
      }
    };

    const handleWheel = (e) => {
      if (!isScrolling) {
        isScrolling = true;

        const deltaThreshold = +cardsContainer.offsetWidth / 2;

        let delta = e.deltaX * 100;
        if (delta > deltaThreshold) {
          // Scrolled to the right (next card)
          nextCard(1);
          nextIndicator(1);
        } else if (delta < -deltaThreshold) {
          // Scrolled to the left (previous card)
          nextCard(-1);
          nextIndicator(-1);
        }

        clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(() => {
          isScrolling = false;
        }, 400); // Adjust as needed
      }

      e.preventDefault();
    };

    // Initialize active dot
    activeIndicator(dotIndex);

    cardsContainer.addEventListener("wheel", handleWheel, { passive: false });
    cardsContainer.addEventListener("mousedown", touchStart, {
      passive: false
    });
    cardsContainer.addEventListener("touchstart", touchStart, {
      passive: false
    });
    cardsContainer.addEventListener("mouseup", touchEnd, { passive: false });
    cardsContainer.addEventListener("touchend", touchEnd, { passive: false });
  }
  
})();
