#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  MyAstrology — নিরাপত্তা চালু করা, এক কমান্ডে (২০২৬-০৯-২৯)
#  চালান:   bash scripts/deploy-security.sh
#
#  যা করে (প্রতিটি ধাপের আগে বাংলায় বলে, ব্যর্থ হলে থেমে যায়):
#   ১. Firestore নিয়ম — ভুয়া অর্ডার (অন্যের নামে / "প্রস্তুত" অবস্থায়) আটকানো
#   ২. Razorpay webhook + যাচাই-ফাংশন — অ্যাডমিন পাতার "যাচাই" বোতাম (Key Secret লাগে না)
#  আগে পরীক্ষা: scripts/verify-firestore-rules.js (emulator), scripts/verify-rzp-fn.js
#  webhook-এর গোপন শব্দ কেবল Firebase-এর সুরক্ষিত ভাণ্ডারে থাকে; পর্দায় একবার দেখায় (Razorpay-তে বসাতে)।
# ═══════════════════════════════════════════════════════════════
set -u
PROJECT=myastrology-addd3
cd "$(dirname "$0")/.." || exit 1

say()  { printf '\n\033[1m%s\033[0m\n' "$1"; }
fail() { printf '\n❌ %s\n' "$1"; exit 1; }

say "① Firebase-এর যন্ত্র আছে কি না দেখছি…"
if ! command -v firebase >/dev/null 2>&1; then
  echo "নেই — বসাচ্ছি (একবারই লাগে, কয়েক মিনিট)…"
  # Cloud Shell-এ -g বসাতে অনুমতি নাও থাকতে পারে — তখন npx দিয়ে চালানো
  npm i -g firebase-tools >/dev/null 2>&1 || firebase() { npx -y firebase-tools@latest "$@"; }
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

say "④ Razorpay যাচাই — webhook"
echo "Razorpay-র Key Secret লাগবে না। webhook-এর নিজস্ব গোপন শব্দ এই স্ক্রিপ্টই বানাবে"
echo "(আগের বার বানানো থাকলে সেটাই আবার ব্যবহার করবে — Razorpay-র সঙ্গে মিল থাকে)।"
# ⛔ ২০২৬-০৯-২৮ — আগে প্রতিবার চালালেই Secret পর্দায় ছাপা হত, আর সহকর্মী স্বাভাবিকভাবেই
# ফলের স্ক্রিনশট পাঠালেন — Secret চ্যাটে চলে গেল। এখন ছাপা হয় কেবল নতুন বানালে।
# ফাঁস হলে:  bash scripts/deploy-security.sh --new-secret  (নতুন বানিয়ে একবার দেখায়)।
NEW=0
if [ "${1:-}" != "--new-secret" ] && SECRET=$(firebase functions:secrets:access RZP_WEBHOOK_SECRET --project "$PROJECT" 2>/dev/null) && [ -n "$SECRET" ]; then
  echo "আগের গোপন শব্দই রইল।"
else
  NEW=1
  SECRET=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))") || fail "গোপন শব্দ বানানো গেল না।"
  printf '%s' "$SECRET" | firebase functions:secrets:set RZP_WEBHOOK_SECRET --data-file - --project "$PROJECT" --force \
    || fail "গোপন শব্দ Firebase-এ রাখা গেল না।"
fi
echo "ফাংশনের সহায়ক প্যাকেজ বসাচ্ছি (প্রথমবার কয়েক মিনিট)…"
( cd functions && npm install --no-audit --no-fund ) || fail "functions-এর প্যাকেজ বসানো গেল না।"
LOG=$(mktemp)
firebase deploy --only functions:razorpayWebhook,functions:adminVerifyRazorpayPayment --project "$PROJECT" 2>&1 | tee "$LOG"
# ⛔ ২০২৬-০৯-৩০ — Termux-এ "env: 'node': Permission denied"-এর পরেও firebase ০ ফেরত দিল, আর
# স্ক্রিপ্ট সাফল্যের ধাপ দেখিয়ে দিল। তাই এখন প্রস্থান-সংকেত নয়, "Deploy complete!" লেখা দেখা হয়।
if [ "${PIPESTATUS[0]}" -ne 0 ] || ! grep -q "Deploy complete" "$LOG"; then
  rm -f "$LOG"
  fail "ফাংশন চালু হলো না — Razorpay-তে এখন কিছু বসাবেন না। স্ক্রিনশট পাঠান।"
fi
URL=$(grep -o 'https://[^ ]*razorpaywebhook[^ ]*' "$LOG" | head -1)
[ -n "$URL" ] || URL="https://asia-south1-${PROJECT}.cloudfunctions.net/razorpayWebhook"
rm -f "$LOG"

if [ "$NEW" = "1" ]; then
  say "⑤ শেষ কাজ — Razorpay-তে Secret বসানো"
  echo "Razorpay ড্যাশবোর্ড → Account & Settings → Webhooks"
  echo "  · আগে webhook বসানো থাকলে: সেটার Edit → Secret-এর ঘরে নিচেরটা বসিয়ে Save"
  echo "  · না থাকলে: + Add New Webhook"
  echo ""
  echo "  Webhook URL :  $URL"
  echo "  Secret      :  $SECRET"
  echo "  Active Events:  payment.captured · payment.failed · refund.processed"
  echo ""
  echo "⚠️ এই পর্দার স্ক্রিনশট কাউকে পাঠাবেন না — Secret-টা কপি করে সোজা Razorpay-তে বসান।"
  echo "   Razorpay-তে বসানোর আগে পর্যন্ত আসা পেমেন্টের খবর Razorpay নিজেই পরে আবার পাঠায়, কিছু হারায় না।"
else
  say "⑤ Razorpay-তে কিছু বদলাতে হবে না — আগের webhook ও Secret-ই চলছে।"
  echo "  (Secret এখানে ইচ্ছে করেই দেখানো হয় না — স্ক্রিনশট নিরাপদ।)"
fi
unset SECRET
say "✅ হয়ে গেল। এরপর যত পেমেন্ট আসবে, অ্যাডমিন পাতার 'যাচাই' বোতাম সেটা মিলিয়ে দেখাবে।"
