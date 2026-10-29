import test from 'node:test';
import assert from 'node:assert/strict';
import { bestiaryFamilies, familyMonsters, renderBestiaryBrowser, renderBestiaryFamily, renderBestiary, bestiaryDefaultLevel } from '../src/ui/bestiary.js';
test('Le bestiaire ouvre les familles illustrées dans l’ordre alphabétique',()=>{
 assert.deepEqual(bestiaryFamilies().map(f=>f.name),['Bêtes','Insectes','Slime']);
 const html=renderBestiaryBrowser();
 assert.match(html,/data-bestiary-screen="families"/);
 assert.equal((html.match(/class="bestiary-family-card"/g)||[]).length,3);
 assert.equal((html.match(/<svg/g)||[]).length,3);
 assert.ok(!html.includes('data-monster="'));
});
test('Une famille regroupe uniquement ses monstres, normaux puis boss',()=>{
 const html=renderBestiaryFamily('slime');
 for(const monster of familyMonsters('slime'))assert.ok(html.includes(`data-monster="${monster.id}"`));
 assert.ok(!html.includes('data-monster="boar"'));
 assert.ok(html.indexOf('data-monster-group="normal"')<html.indexOf('data-monster-group="boss"'));
 assert.match(renderBestiaryFamily('unknown'),/data-bestiary-screen="families"/);
});
test('La fiche présente identité et butins avant combat et statistiques',()=>{
 const html=renderBestiary('volcano-slime');
 assert.equal(bestiaryDefaultLevel('volcano-slime'),9);
 assert.match(html,/id="monster-level-badge">Niveau 9/);
 assert.match(html,/class="monster-zone"/);
 assert.ok(html.indexOf('bestiary-monster-header')<html.indexOf('pane-bestiary-overview'));
 assert.match(html,/id="pane-bestiary-overview"[^>]*>/);
 assert.match(html,/id="pane-bestiary-stats"[^>]*hidden/);
 assert.ok(html.indexOf('id="monster-level"')>html.indexOf('id="pane-bestiary-stats"'));
});
