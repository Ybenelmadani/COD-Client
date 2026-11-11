import { useI18n } from "../i18n/index.jsx";
import { Link } from "react-router-dom";
import LanguageSwitch from "../components/LanguageSwitch.jsx";

export default function Privacy() {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";

  return (
    <div className="auth" style={{ maxWidth: 720 }}>
      <div className="between">
        <Link to="/" className="link">← {t("notfound.home")}</Link>
        <LanguageSwitch />
      </div>
      <h1 className="mt">{t("privacy.title")}</h1>

      <div className="card" style={{ lineHeight: 1.7, fontSize: ".92rem" }}>
        {isAr ? (
          <>
            <p><strong>ما البيانات المخزَّنة؟</strong></p>
            <p className="mb">رقم الهاتف فقط — لا، في الواقع لا نُخزّن الرقم نفسه إطلاقاً. نُخزّن بصمة مشفّرة (HMAC-SHA256) باستخدام مفتاح سري. لا يمكن عكس البصمة لاستخراج الرقم.</p>
            <p><strong>لماذا التحويل إلى بصمة؟</strong></p>
            <p className="mb">حتى نتمكن من ربط طلبات الزبون نفسه عبر بائعين مختلفين دون معرفة من هو. هذا يحمي خصوصية الزبون ويُبقي الخدمة فعّالة.</p>
            <p><strong>من يرى ماذا؟</strong></p>
            <p className="mb">ترى فقط أرقاماً مجمَّعة عن زبائنك أنت. عند التحقق، ترى نقطة (موثوق/جديد/انتباه/خطر) وأعداداً فقط، دون أي معلومة عن البائعين الآخرين.</p>
            <p><strong>مدة الحفظ</strong></p>
            <p className="mb">سجلات التحقق تُحذف تلقائياً بعد ساعة واحدة (نظام الحدّ). بيانات الطلبات تُحفظ طوال فترة حسابك.</p>
            <p><strong>طلب الحذف</strong></p>
            <p className="mb">يمكنك طلب حذف حسابك وكل بياناتك المرتبطة عبر التواصل معنا على واتساب.</p>
            <p><strong>الاتصال</strong></p>
            <p>لأي سؤال حول بياناتك، تواصل معنا عبر واتساب.</p>
          </>
        ) : (
          <>
            <p><strong>Quelles données sont stockées ?</strong></p>
            <p className="mb">Le numéro de téléphone ? En réalité, nous ne stockons jamais le numéro lui-même. Nous conservons uniquement une empreinte chiffrée (HMAC-SHA256) produite avec une clé secrète. L'empreinte ne peut pas être inversée pour retrouver le numéro.</p>
            <p><strong>Pourquoi transformer en empreinte ?</strong></p>
            <p className="mb">Pour pouvoir relier les commandes d'un même client chez différents vendeurs sans jamais savoir qui il est. Cela protège la vie privée du client tout en gardant le service utile.</p>
            <p><strong>Qui voit quoi ?</strong></p>
            <p className="mb">Vous ne voyez que les chiffres agrégés de vos propres clients. Lors d'une vérification, vous obtenez un score (fiable/nouveau/attention/risque) et des comptes, jamais d'information sur les autres vendeurs.</p>
            <p><strong>Durée de conservation</strong></p>
            <p className="mb">Les journaux de vérification sont supprimés automatiquement après une heure (système de limite). Les données de commandes sont conservées pendant la durée de votre compte.</p>
            <p><strong>Demande de suppression</strong></p>
            <p className="mb">Vous pouvez demander la suppression de votre compte et de toutes vos données associées via WhatsApp.</p>
            <p><strong>Contact</strong></p>
            <p>Pour toute question sur vos données, contactez-nous sur WhatsApp.</p>
          </>
        )}
      </div>
    </div>
  );
}
