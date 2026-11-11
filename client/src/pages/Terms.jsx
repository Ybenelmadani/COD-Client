import { useI18n } from "../i18n/index.jsx";
import { Link } from "react-router-dom";
import LanguageSwitch from "../components/LanguageSwitch.jsx";

export default function Terms() {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";

  return (
    <div className="auth" style={{ maxWidth: 720 }}>
      <div className="between">
        <Link to="/" className="link">← {t("notfound.home")}</Link>
        <LanguageSwitch />
      </div>
      <h1 className="mt">{t("terms.title")}</h1>
      <p className="muted" style={{ fontSize: ".82rem", marginBottom: 18 }}>
        {isAr ? "يجب مراجعة هذا المستند من طرف محامٍ مغربي قبل الإطلاق العمومي." : "À faire relire par un juriste marocain avant le lancement public."}
      </p>

      <div className="card" style={{ lineHeight: 1.7, fontSize: ".92rem" }}>
        {isAr ? (
          <>
            <p><strong>1. ما يفعله الخدمة</strong></p>
            <p className="mb">COD Shield أداة مساعدة في اتخاذ القرار قبل الشحن، وليست "قائمة سوداء". تقدم نقطة تقييم عن مستوى خطر الزبون بناءً على سجله لدى بائعين آخرين.</p>
            <p><strong>2. البيانات المجمَّعة</strong></p>
            <p className="mb">نجمع فقط البصمة المشفّرة لرقم الهاتف (HMAC-SHA256) ونتيجة الطلب (تم التوصيل، رفض، لا يرد). لا نُخزّن الاسم ولا العنوان ولا أي معلومة شخصية عن الزبون.</p>
            <p><strong>3. السرية بين البائعين</strong></p>
            <p className="mb">لا يمكن لأي بائع رؤية بيانات زبائن بائع آخر. نتيجة التحقق تُظهر أرقاماً مجمَّعة فقط، دون اسم البائع أو تفاصيل طلباته.</p>
            <p><strong>4. واجبات البائع</strong></p>
            <p className="mb">يلتزم البائع بتسجيل الحالات الصادقة. الإدخال المتعمّد لمعلومات خاطئة يؤدي إلى إيقاف الحساب.</p>
            <p><strong>5. الاستخدامات المحظورة</strong></p>
            <p className="mb">يُمنع استخدام الخدمة للمضايقة، التشهير، أو انتهاك خصوصية الأشخاص. النقطة تُستخدم فقط لاتخاذ قرار الشحن.</p>
            <p><strong>6. طبيعة النقطة</strong></p>
            <p className="mb">النقطة إرشادية ولا تُعوّض حكم البائع. COD Shield غير مسؤولة عن قرارات الشحن.</p>
            <p><strong>7. الإطار القانوني</strong></p>
            <p className="mb">تخضع معالجة البيانات لقانون 09-08 وللإشراف الذي تمارسه اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP).</p>
            <p><strong>8. حق الحذف والاتصال</strong></p>
            <p className="mb">يمكنك طلب حذف حسابك وبياناتك في أي وقت عبر التواصل معنا.</p>
            <p><strong>9. الدفع والإنهاء</strong></p>
            <p className="mb">الاشتراك شهري (99-199 درهم)، يُفعَّل يدوياً بعد الدفع. يمكنك إنهاء الاشتراك في أي وقت دون ردّ المبالغ المدفوعة.</p>
          </>
        ) : (
          <>
            <p><strong>1. Ce que fait le service</strong></p>
            <p className="mb">COD Shield est une aide à la décision avant expédition, pas une « liste noire ». Il affiche un score de risque basé sur l'historique du client chez d'autres vendeurs.</p>
            <p><strong>2. Données collectées</strong></p>
            <p className="mb">Nous collectons uniquement l'empreinte chiffrée du numéro (HMAC-SHA256) et le résultat de la commande (livré, refusé, injoignable). Aucun nom, adresse ni information personnelle du client n'est stocké.</p>
            <p><strong>3. Confidentialité entre vendeurs</strong></p>
            <p className="mb">Aucun vendeur ne peut voir les clients d'un autre. Le résultat affiche des chiffres agrégés uniquement, jamais le nom du vendeur ni le détail de ses commandes.</p>
            <p><strong>4. Obligations du vendeur</strong></p>
            <p className="mb">Le vendeur s'engage à renseigner des statuts honnêtes. Toute saisie volontairement erronée entraîne la suspension du compte.</p>
            <p><strong>5. Usages interdits</strong></p>
            <p className="mb">Il est interdit d'utiliser le service pour harceler, diffamer, ou porter atteinte à la vie privée. Le score sert uniquement à décider de l'expédition.</p>
            <p><strong>6. Nature du score</strong></p>
            <p className="mb">Le score est indicatif et ne remplace pas le jugement du vendeur. COD Shield n'est pas responsable des décisions d'expédition.</p>
            <p><strong>7. Cadre légal</strong></p>
            <p className="mb">Le traitement des données est soumis à la loi 09-08 et au contrôle de la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP).</p>
            <p><strong>8. Droit de suppression et contact</strong></p>
            <p className="mb">Vous pouvez demander la suppression de votre compte et de vos données à tout moment.</p>
            <p><strong>9. Paiement et résiliation</strong></p>
            <p className="mb">L'abonnement est mensuel (99-199 MAD), activé manuellement après paiement. Vous pouvez résilier à tout moment, sans remboursement des sommes versées.</p>
          </>
        )}
      </div>
    </div>
  );
}
