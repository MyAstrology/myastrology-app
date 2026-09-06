/* বাংলা অক্ষর গোনা — range সবসময় কোডপয়েন্টে, কারণ বাংলা হরফে লিখলে
   ড়/ঢ়/য়-এর ভাঙা রূপে "Range out of order" দিয়ে স্ক্রিপ্টই মরে। */
const BN_G = /[অ-হৎড়-য়]/g;
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
module.exports = { BN_G, strip, count: s => (s.match(BN_G) || []).length };
