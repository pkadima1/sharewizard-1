# Translation Guidelines - EngagePerfect AI
## French UI Translation Standards & Best Practices

**Date:** December 2024  
**Status:** ✅ ACTIVE - Current Development Standards  
**Language Focus:** French (fr) - Primary UI Language

---

## 🎯 **OVERVIEW**

This document outlines the translation standards, template patterns, and best practices for maintaining consistent French translations across the EngagePerfect AI application. All UI text must be in French as per user requirements [[memory:4480569]].

---

## 📋 **TRANSLATION STRUCTURE**

### **File Organization**
```
public/locales/fr/
├── longform.json          # Main wizard & content generation
├── partners.json          # Partner management & admin
├── adminPartners.json     # Partner applications
├── common.json           # Shared UI elements
├── dashboard.json        # Dashboard components
└── [other-namespaces].json
```

### **Translation Namespace Usage**
- `longform` - Content wizard, topic suggestions, keyword generation
- `partners` - Partner management, admin functions
- `common` - Shared buttons, messages, time formats
- `dashboard` - Dashboard-specific content

---

## 🏗️ **TEMPLATE PATTERN CONVENTIONS**

### **1. Topic Suggestion Templates**
Located in: `public/locales/fr/longform.json` → `smartComponents.topicEngine.templates`

**Pattern Structure:**
```json
{
  "templates": {
    "transformativeImpact": "Comment {{topic}} révolutionne {{industry}}",
    "comprehensiveResource": "Le guide complet de {{topic}} pour {{audience}} dans {{industry}}",
    "currentYearStrategy": "Stratégie {{topic}} : Feuille de route d'implémentation {{year}}"
  }
}
```

**Template Categories:**
- **Topic-Centric:** Revolutionary impact, comprehensive guides, strategy roadmaps
- **Industry Fusion:** Investment opportunities, best practices, leadership insights  
- **Audience-Specific:** Beginners, professionals, entrepreneurs, students

### **2. Variable Substitution Rules**
- `{{topic}}` - User-entered topic (keep as-is)
- `{{industry}}` - Selected industry (use French industry names)
- `{{audience}}` - Target audience (use French audience descriptors)
- `{{year}}` - Current year (numeric)

### **3. French Grammar Guidelines**
- **Gender Agreement:** Templates must work with masculine/feminine topics
- **Plural Forms:** Use appropriate plural forms for multiple items
- **Verb Conjugation:** Use infinitive or present tense as appropriate
- **Articles:** Include proper articles (le, la, les, du, de la, etc.)

---

## 🔧 **COMPONENT TRANSLATION STANDARDS**

### **1. Smart Components**
**TopicSuggestionEngine.tsx:**
```typescript
// ✅ CORRECT - Using translation keys
const suggestion = t('smartComponents.topicEngine.templates.transformativeImpact', {
  topic: userTopic,
  industry: selectedIndustry
});

// ❌ WRONG - Hardcoded English
const suggestion = `How ${userTopic} is Revolutionizing ${selectedIndustry}`;
```

**SmartKeywordGenerator.tsx:**
```typescript
// ✅ CORRECT - All UI text uses t() function
<h3>{t('smartKeywordGenerator.title')}</h3>
<p>{t('smartKeywordGenerator.subtitle')}</p>

// ❌ WRONG - Hardcoded English strings
<h3>Smart Keyword Generator</h3>
<p>AI-powered keyword intelligence</p>
```

### **2. Form Components**
**Placeholder Translations:**
```json
{
  "step2": {
    "placeholders": {
      "industry": "Sélectionnez votre secteur ou niche"
    }
  },
  "step3": {
    "placeholders": {
      "contentType": "Sélectionnez le type de contenu",
      "contentTone": "Sélectionnez le ton du contenu"
    }
  }
}
```

**Usage in Components:**
```typescript
<SelectValue placeholder={t('step2.placeholders.industry')} />
```

### **3. Error Messages & Notifications**
```json
{
  "contextualHelp": {
    "support": {
      "success": {
        "title": "Demande de Support Envoyée",
        "description": "Votre demande de support a été envoyée à notre équipe. Nous vous répondrons bientôt !"
      },
      "error": {
        "title": "Erreur",
        "description": "Échec de l'envoi de la demande de support. Veuillez nous écrire directement à engageperfect@gmail.com"
      }
    }
  }
}
```

---

## 🚫 **COMMON MISTAKES TO AVOID**

### **1. Hardcoded English Strings**
```typescript
// ❌ WRONG
<button>Get Ideas</button>
toast({ title: "Success", description: "Operation completed" });

// ✅ CORRECT
<button>{t('buttons.getIdeas')}</button>
toast({ title: t('messages.success.title'), description: t('messages.success.description') });
```

### **2. English-French Mixed Templates**
```typescript
// ❌ WRONG - Creates nonsensical output
const suggestion = `How ${frenchTopic} is Revolutionizing Marketing`;

// ✅ CORRECT - Proper French structure
const suggestion = t('templates.transformativeImpact', { topic: frenchTopic, industry: 'Marketing' });
```

### **3. Missing Translation Keys**
```typescript
// ❌ WRONG - Will show key instead of text
<h3>{t('smartKeywordGenerator.missingKey')}</h3>

// ✅ CORRECT - Ensure key exists in translation file
<h3>{t('smartKeywordGenerator.title')}</h3>
```

---

## 📝 **TRANSLATION KEY NAMING CONVENTIONS**

### **Hierarchical Structure**
```
componentName.section.subsection.key
smartKeywordGenerator.title
smartKeywordGenerator.buttons.regenerate
smartKeywordGenerator.messages.enhancedKeywordsGenerated
```

### **Key Types**
- **Titles:** `title`, `subtitle`
- **Buttons:** `buttons.actionName`
- **Messages:** `messages.messageType`
- **Placeholders:** `placeholders.fieldName`
- **Errors:** `errors.errorType`
- **Labels:** `labels.fieldName`

---

## 🧪 **TESTING TRANSLATIONS**

### **1. Manual Testing Checklist**
- [ ] Navigate to French UI (`/fr/` or language selector)
- [ ] Test all wizard steps with French topics
- [ ] Verify "Obtenir des idées" generates proper French suggestions
- [ ] Check form placeholders are in French
- [ ] Test error messages and notifications
- [ ] Verify no English text appears anywhere

### **2. Translation Validation**
```bash
# Validate JSON syntax
node -e "JSON.parse(require('fs').readFileSync('public/locales/fr/longform.json', 'utf8'))"

# Check for missing keys
grep -r "t('" src/ | grep -v "t('common\."
```

### **3. Component Testing**
```typescript
// Test with French input
const frenchTopic = "un contenu ciblé et engageant";
const suggestions = generateTopicSuggestions(frenchTopic);
// Should return: "Comment un contenu ciblé et engageant révolutionne Marketing"
```

---

## 🔄 **TRANSLATION WORKFLOW**

### **1. Adding New Features**
1. Identify all UI text in new component
2. Create translation keys in appropriate namespace
3. Add French translations to relevant JSON file
4. Update component to use `t()` function
5. Test in French UI mode

### **2. Fixing Translation Issues**
1. Identify hardcoded English strings
2. Create appropriate translation keys
3. Add French translations
4. Update component code
5. Test functionality

### **3. Template Updates**
1. Update template patterns in `longform.json`
2. Test template generation with French topics
3. Verify grammar and sentence structure
4. Update component logic if needed

---

## 📊 **CURRENT STATUS**

### **✅ COMPLETED**
- TopicSuggestionEngine French templates (20+ patterns)
- SmartKeywordGenerator full French translation
- Form placeholder translations
- Error message translations
- Support notification translations

### **🔧 MAINTAINED**
- All wizard step components use translation system
- Admin components properly translated
- Common UI elements in French

### **⚠️ MONITORING**
- Watch for new hardcoded English strings
- Validate template generation quality
- Ensure consistent French grammar

---

## 🎯 **QUALITY STANDARDS**

### **French Language Requirements**
- **Grammar:** Proper verb conjugation and gender agreement
- **Vocabulary:** Professional, clear, and engaging
- **Consistency:** Uniform terminology across components
- **User Experience:** Natural, fluent French text

### **Technical Requirements**
- **No Hardcoded Strings:** All UI text must use translation keys
- **Proper Namespacing:** Use appropriate translation namespaces
- **Template Variables:** Correct variable substitution
- **JSON Validation:** No syntax errors in translation files

---

## 📞 **SUPPORT & MAINTENANCE**

### **When Issues Arise**
1. Check translation file syntax
2. Verify translation keys exist
3. Test template generation
4. Validate component logic
5. Update documentation if needed

### **Regular Maintenance**
- Monthly review of new components
- Quarterly translation quality audit
- Annual French language review
- Continuous monitoring for hardcoded strings

---

*This document is maintained as part of the EngagePerfect AI development process. All team members must follow these guidelines to ensure consistent French UI experience.*

**Last Updated:** December 2024  
**Next Review:** January 2025
