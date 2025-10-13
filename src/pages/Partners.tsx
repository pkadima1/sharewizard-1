import React from 'react';
import { Link } from 'react-router-dom';
import { useLocalizedPath } from '@/utils/routeUtils';
import StorageImage from '@/components/StorageImage';
import { useTranslation } from 'react-i18next';

const Partners: React.FC = () => {
  const { getLocalizedPath } = useLocalizedPath();
  const { t } = useTranslation('partners');
  
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 pt-24">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          {t('landing.hero.title')}
        </h1>
        <p className="mt-3 text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('landing.hero.subtitle')}
        </p>
        <div className="mt-8">
          <StorageImage 
            storagePath="EngPerfectPartnerMedia/header Image.png" 
            fallbackSrc="/img/partners/header-image.svg" 
            alt={t('landing.hero.imageAlt')} 
            className="w-full max-h-[420px] object-cover rounded-xl shadow-md" 
          />
        </div>
      </section>

      {/* What is EngagePerfect */}
      <section className="mt-14 grid md:grid-cols-2 gap-8 items-center">
        <div className="order-2 md:order-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('landing.whatIs.title')}
          </h2>
          <p className="mt-4 text-gray-700 dark:text-gray-300">
            {t('landing.whatIs.description1')}
          </p>
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            {t('landing.whatIs.description2')}
          </p>
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            {t('landing.whatIs.description3')}
          </p>
        </div>
        <div className="order-1 md:order-2">
          <StorageImage 
            storagePath="EngPerfectPartnerMedia/handshake between.png" 
            fallbackSrc="/img/partners/handshake-between.svg" 
            alt={t('landing.whatIs.imageAlt')} 
            className="w-full rounded-xl shadow-md" 
          />
        </div>
      </section>

      {/* Why partner */}
      <section className="mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center">
          {t('landing.whyPartner.title')}
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50">
            <div className="text-2xl">{t('landing.whyPartner.benefit1.icon')}</div>
            <h3 className="mt-2 font-semibold">{t('landing.whyPartner.benefit1.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('landing.whyPartner.benefit1.description')}</p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50">
            <div className="text-2xl">{t('landing.whyPartner.benefit2.icon')}</div>
            <h3 className="mt-2 font-semibold">{t('landing.whyPartner.benefit2.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('landing.whyPartner.benefit2.description')}</p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50">
            <div className="text-2xl">{t('landing.whyPartner.benefit3.icon')}</div>
            <h3 className="mt-2 font-semibold">{t('landing.whyPartner.benefit3.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('landing.whyPartner.benefit3.description')}</p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50">
            <div className="text-2xl">{t('landing.whyPartner.benefit4.icon')}</div>
            <h3 className="mt-2 font-semibold">{t('landing.whyPartner.benefit4.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('landing.whyPartner.benefit4.description')}</p>
          </div>
        </div>
      </section>

      {/* Who can apply */}
      <section className="mt-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('landing.whoCanApply.title')}
          </h2>
          <ul className="mt-4 space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
            <li>{t('landing.whoCanApply.list1')}</li>
            <li>{t('landing.whoCanApply.list2')}</li>
            <li>{t('landing.whoCanApply.list3')}</li>
            <li>{t('landing.whoCanApply.list4')}</li>
          </ul>
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            {t('landing.whoCanApply.footer')}
          </p>
        </div>
        <div>
          <StorageImage 
            storagePath="EngPerfectPartnerMedia/laptop screen showing.png" 
            fallbackSrc="/img/partners/laptop-screen-showing.svg" 
            alt={t('landing.whoCanApply.imageAlt')} 
            className="w-full rounded-xl shadow-md" 
          />
        </div>
      </section>

      {/* What you'll do */}
      <section className="mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {t('landing.whatYouDo.title')}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 text-gray-700 dark:text-gray-300">
          <li className="bg-white/70 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {t('landing.whatYouDo.task1')}
          </li>
          <li className="bg-white/70 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {t('landing.whatYouDo.task2')}
          </li>
          <li className="bg-white/70 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {t('landing.whatYouDo.task3')}
          </li>
          <li className="bg-white/70 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {t('landing.whatYouDo.task4')}
          </li>
        </ul>
      </section>

      {/* How it works */}
      <section className="mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {t('landing.howItWorks.title')}
        </h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  {t('landing.howItWorks.table.stepHeader')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  {t('landing.howItWorks.table.descriptionHeader')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-3 font-medium">{t('landing.howItWorks.step1.label')}</td>
                <td className="px-4 py-3">
                  {t('landing.howItWorks.step1.description')} <Link className="text-blue-600 hover:underline" to={getLocalizedPath('partner-registration')}>{t('landing.howItWorks.step1.linkText')}</Link>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">{t('landing.howItWorks.step2.label')}</td>
                <td className="px-4 py-3">{t('landing.howItWorks.step2.description')}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">{t('landing.howItWorks.step3.label')}</td>
                <td className="px-4 py-3">{t('landing.howItWorks.step3.description')}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">{t('landing.howItWorks.step4.label')}</td>
                <td className="px-4 py-3">{t('landing.howItWorks.step4.description')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Growth Path */}
      <section className="mt-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <StorageImage 
            storagePath="EngPerfectPartnerMedia/staircase or ladder.png" 
            fallbackSrc="/img/partners/staircase.svg" 
            alt={t('landing.growthPath.imageAlt')} 
            className="w-full rounded-xl shadow-md" 
          />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('landing.growthPath.title')}
          </h2>
          <ul className="mt-4 space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              <strong>{t('landing.growthPath.level1.title')}</strong> {t('landing.growthPath.level1.description')}
            </li>
            <li>
              <strong>{t('landing.growthPath.level2.title')}</strong> {t('landing.growthPath.level2.description')}
            </li>
            <li>
              <strong>{t('landing.growthPath.level3.title')}</strong> {t('landing.growthPath.level3.description')}
            </li>
          </ul>
        </div>
      </section>

      {/* Culture */}
      <section className="mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {t('landing.culture.title')}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50">
            <p className="text-gray-700 dark:text-gray-300">{t('landing.culture.value1')}</p>
          </div>
          <div className="rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50">
            <p className="text-gray-700 dark:text-gray-300">{t('landing.culture.value2')}</p>
          </div>
          <div className="rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50">
            <p className="text-gray-700 dark:text-gray-300">{t('landing.culture.value3')}</p>
          </div>
          <div className="rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50">
            <p className="text-gray-700 dark:text-gray-300">{t('landing.culture.value4')}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {t('landing.cta.title')}
        </h2>
        <p className="mt-3 text-gray-700 dark:text-gray-300">{t('landing.cta.applicationText')}</p>
        <p className="mt-1">
          <a 
            href={`https://www.engageperfect.com${getLocalizedPath('partner-registration')}`} 
            target="_blank" 
            rel="noreferrer" 
            className="text-blue-600 hover:underline break-words"
          >
            {t('landing.cta.applicationLink')}
          </a>
        </p>
        <p className="mt-6 text-gray-700 dark:text-gray-300">{t('landing.cta.questionText')}</p>
        <p className="font-medium">
          📧 <a className="hover:underline" href={`mailto:${t('landing.cta.email')}`}>
            {t('landing.cta.email')}
          </a>
        </p>
        <div className="mt-8">
          <StorageImage 
            storagePath="EngPerfectPartnerMedia/happy diverse team celebrating.png" 
            fallbackSrc="/img/partners/happy-team.svg" 
            alt={t('landing.cta.imageAlt')} 
            className="w-full rounded-xl shadow-md" 
          />
        </div>
      </section>
    </div>
  );
};

export default Partners;
