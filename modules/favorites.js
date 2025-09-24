// const favorites = new Map(); // userId => [ { type: 'tale'|'relato', slug } ]

// function getUserFavorites(userId) {
//   return favorites.get(userId) || [];
// }

// function addFavorite(userId, item) {
//   const current = getUserFavorites(userId);
//   if (
//     !current.find((fav) => fav.slug === item.slug && fav.type === item.type)
//   ) {
//     favorites.set(userId, [...current, item]);
//   }
// }

// function removeFavorite(userId, item) {
//   const current = getUserFavorites(userId);
//   favorites.set(
//     userId,
//     current.filter((fav) => fav.slug !== item.slug || fav.type !== item.type)
//   );
// }

// module.exports = { getUserFavorites, addFavorite, removeFavorite };

const favorites = new Map(); // userId => [ { type: 'tale'|'relato', slug } ]

function getUserFavorites(userId) {
  return favorites.get(userId) || [];
}

function addFavorite(userId, item) {
  const current = getUserFavorites(userId);
  if (
    !current.find((fav) => fav.slug === item.slug && fav.type === item.type)
  ) {
    favorites.set(userId, [...current, item]);
  }
}

function removeFavorite(userId, item) {
  const current = getUserFavorites(userId);
  favorites.set(
    userId,
    current.filter((fav) => fav.slug !== item.slug || fav.type !== item.type)
  );
}

function toggleFavorite(userId, item) {
  const current = getUserFavorites(userId);
  const exists = current.find(
    (fav) => fav.slug === item.slug && fav.type === item.type
  );
  if (exists) {
    removeFavorite(userId, item);
    return false; // removed
  } else {
    addFavorite(userId, item);
    return true; // added
  }
}

module.exports = {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
};
