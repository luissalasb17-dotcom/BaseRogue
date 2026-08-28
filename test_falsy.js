
const rarityWeights = { Uncommon: 7.0, Rare: 2.5, Epic: 0.5, Legendary: 0.0 };
const p = { name: 'Ichiro', rarity: 'Legendary' };
let w = 1.0;
if (rarityWeights && rarityWeights[p.rarity]) {
    w *= rarityWeights[p.rarity];
}
console.log('Resulting weight for Legendary with truthy check:', w);

let w_fixed = 1.0;
if (rarityWeights && rarityWeights[p.rarity] !== undefined) {
    w_fixed *= rarityWeights[p.rarity];
}
console.log('Resulting weight for Legendary with !== undefined check:', w_fixed);
