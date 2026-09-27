#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  MyAstrology — নিরাপত্তা চালু করা, এক কমান্ডে (২০২৬-০৯-২৯)
#  চালান:   bash scripts/deploy-security.sh
#
#  যা করে (প্রতিটি ধাপের আগে বাংলায় বলে, ব্যর্থ হলে থেমে যায়):
#   ১. Firestore নিয়ম — ভুয়া অর্ডার (অন্যের নামে / "প্রস্তুত" অবস্থায়) আটকানো
#   ২. Razorpay যাচাই-ফাংশন — অ্যাডমিন পাতার "যাচাই" বোতাম
#  আগে পরীক্ষা: scripts/verify-firestore-rules.js (emulator), scripts/verify-rzp-fn.js
#  Key Secret কোথাও লেখা হয় না — কেবল Firebase-এর সুরক্ষিত ভাণ্ডারে যায়।
# ═══════════════════════════════════════════════════════════════
set -u
PROJECT=myastrology-addd3
KEY_ID=rzp_live_SN8p6DJxPYFVL1      # সাইটের পাতায় যে নম্বর আছে, সেটাই (গোপন নয়)
cd "$(dirname "$0")/.." || exit 1

say()  { printf '\n\033[1m%s\033[0m\n' "$1"; }
fail() { printf '\n❌ %s\n' "$1"; exit 1; }

say "① Firebase-এর যন্ত্র আছে কি না দেখছি…"
if ! command -v firebase >/dev/null 2>&1; then
  echo "নেই — বসাচ্ছি (একবারই লাগে, কয়েক মিনিট)…"
  npm i -g firebase-tools || fail "firebase-tools বসানো গেল না। নেট দেখে আবার চালান।"
fi

say "② আপনার Google অ্যাকাউন্টে Firebase-এ ঢোকা আছে কি না…"
if ! firebase projects:list >/dev/null 2>&1; then
  echo "ঢোকা নেই। একটা লিংক আসবে — ফোনের ব্রাউজারে খুলে যে Gmail-এ Firebase প্রজেক্টটা খোলা সেটা দিয়ে অনুমতি দিন,"
  echo "তারপর যে কোড দেখাবে সেটা এখানে বসান।"
  firebase login --no-localhost || fail "লগইন হলো না। আবার চালান।"
fi

say "③ Firestore নিয়ম চালু করছি (ভুয়া অর্ডার আটকানো)…"
firebase deploy --only firestore:rules --project "$PROJECT" || fail "নিয়ম চালু হলো না — স্ক্রিনশট পাঠান।"
echo "✅ নিয়ম চালু। ওয়েবসাইটের আসল অর্ডার আগের মতোই চলবে।"

say "④ Razorpay যাচাই-বোতাম"
echo "এর জন্য Razorpay-র Key Secret লাগে (Razorpay ড্যাশবোর্ড → Account & Settings → API Keys-এর সঙ্গে"
echo "যেদিন চাবি বানিয়েছিলেন সেদিন একবার দেখানো হয়েছিল)।"
echo "⚠️ কোথাও লেখা না থাকলে 'Regenerate' চাপবেন না — এখানে 'না' লিখে আমাকে জানান।"
printf 'Key Secret হাতে আছে? (হ্যাঁ/না): '
read -r ans
case "$ans" in
  হ্যাঁ|হ্যা|haa|ha|y|Y|yes|Yes) ;;
  *) echo "ঠিক আছে — ধাপ ④ বাদ। নিয়ম (③) চালু হয়ে গেছে।"; exit 0 ;;
esac
printf 'Key Secret বসান (লেখা দেখা যাবে না, বসিয়ে Enter): '
read -rs SECRET; echo
[ -n "$SECRET" ] || fail "কিছু বসানো হয়নি।"
printf '%s' "$KEY_ID" | firebase functions:secrets:set RZP_KEY_ID --data-file - --project "$PROJECT" --force \
  || fail "RZP_KEY_ID রাখা গেল না।"
printf '%s' "$SECRET" | firebase functions:secrets:set RZP_KEY_SECRET --data-file - --project "$PROJECT" --force \
  || fail "RZP_KEY_SECRET রাখা গেল না।"
unset SECRET
echo "ফাংশনের সহায়ক প্যাকেজ বসাচ্ছি (প্রথমবার কয়েক মিনিট)…"
( cd functions && npm install --no-audit --no-fund ) || fail "functions-এর প্যাকেজ বসানো গেল না।"
firebase deploy --only functions:adminVerifyRazorpayPayment --project "$PROJECT" \
  || fail "যাচাই-ফাংশন চালু হলো না — স্ক্রিনশট পাঠান।"

say "✅ সব চালু। অ্যাডমিন পাতায় কোনো পুরনো আসল অর্ডারে 'যাচাই' চেপে দেখুন — '✅ … এসেছে' দেখানো উচিত।"
