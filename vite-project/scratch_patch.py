import re
import os

app_path = r'c:\Users\dell\Desktop\Generate pdf\vite-project\src\App.jsx'
css_path = r'c:\Users\dell\Desktop\Generate pdf\vite-project\src\index.css'

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add errors state and validation function
content = content.replace('const [isGenerating, setIsGenerating] = useState(false);', 
'''const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    const commonFields = ['raisonSociale', 'siret', 'nomDirigeant', 'telephone', 'email', 'dateSignature', 'ville'];
    let specificFields = [];

    if (selectedDocument === 'TB_FORMATIONS') {
      specificFields = [
        'modaliteFormation', 'intituleFormation', 'dureeHeures', 'lieuFormation', 
        'sanction', 'adresse', 'periodeFormation', 'nomsStagiaires', 'coutHT', 
        'reglement', 'preRequis', 'objectif1', 'publicVise'
      ];
    } else {
      specificFields = [
        'dureeHeures', 'dureeJours', 'dateDebut', 'dateFin', 'modalitePedagogique', 
        'lieuFormation', 'lienConnexion', 'coutHT'
      ];
      formData.stagiaires.forEach((stagiaire, idx) => {
        if (!stagiaire.nom) newErrors[`stagiaire_${idx}_nom`] = true;
        if (!stagiaire.tel) newErrors[`stagiaire_${idx}_tel`] = true;
        if (!stagiaire.email) newErrors[`stagiaire_${idx}_email`] = true;
      });
    }

    [...commonFields, ...specificFields].forEach(field => {
      if (!formData[field] || String(formData[field]).trim() === '') {
        newErrors[field] = true;
        isValid = false;
      }
    });

    if (Object.keys(newErrors).some(k => k.startswith('stagiaire_'))) {
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };''')

# Add validation check to generatePDF
content = content.replace('const generatePDF = async () => {\n    setIsGenerating(true);',
'''const generatePDF = async () => {
    if (!validateForm()) {
      alert("Veuillez remplir tous les champs obligatoires en rouge avant de générer le PDF.");
      return;
    }
    setIsGenerating(true);''')

# Inject errors into inputs
def replacer(match):
    full_input = match.group(0)
    name = match.group(1)
    
    if name in ['tva', 'coutTTC', 'objectif2', 'objectif3', 'objectif4', 'objectif5', 'objectif6']:
        return full_input
        
    new_input = full_input.replace('className="form-input"', f'className={{`form-input ${{errors.{name} ? "input-error" : ""}}`}}')
    new_input = new_input.replace('className="form-input bold-number"', f'className={{`form-input bold-number ${{errors.{name} ? "input-error" : ""}}`}}')
    
    error_span = f'\\n              {{errors.{name} && <span className="error-text">Ce champ est requis</span>}}'
    return new_input + error_span

content = re.sub(r'<input[^>]+name="([^"]+)"[^>]+>', replacer, content)

# Manually fix stagiaires inputs
content = content.replace(
    '<input type="text" placeholder="Ex: Jean Dupont" value={stagiaire.nom} onChange={(e) => handleStagiaireChange(idx, \'nom\', e.target.value)} className="form-input" style={{ marginBottom: 0 }} />',
    '<input type="text" placeholder="Ex: Jean Dupont" value={stagiaire.nom} onChange={(e) => handleStagiaireChange(idx, \'nom\', e.target.value)} className={`form-input ${errors[`stagiaire_${idx}_nom`] ? \'input-error\' : \'\'}`} style={{ marginBottom: 0 }} />\n                      {errors[`stagiaire_${idx}_nom`] && <span className="error-text">Ce champ est requis</span>}'
)

content = content.replace(
    '<input type="text" placeholder="Ex: 06 12..." value={stagiaire.tel} onChange={(e) => handleStagiaireChange(idx, \'tel\', e.target.value)} className="form-input" style={{ marginBottom: 0 }} />',
    '<input type="text" placeholder="Ex: 06 12..." value={stagiaire.tel} onChange={(e) => handleStagiaireChange(idx, \'tel\', e.target.value)} className={`form-input ${errors[`stagiaire_${idx}_tel`] ? \'input-error\' : \'\'}`} style={{ marginBottom: 0 }} />\n                      {errors[`stagiaire_${idx}_tel`] && <span className="error-text">Ce champ est requis</span>}'
)

content = content.replace(
    '<input type="email" placeholder="Ex: mail@..." value={stagiaire.email} onChange={(e) => handleStagiaireChange(idx, \'email\', e.target.value)} className="form-input" style={{ marginBottom: 0 }} />',
    '<input type="email" placeholder="Ex: mail@..." value={stagiaire.email} onChange={(e) => handleStagiaireChange(idx, \'email\', e.target.value)} className={`form-input ${errors[`stagiaire_${idx}_email`] ? \'input-error\' : \'\'}`} style={{ marginBottom: 0 }} />\n                      {errors[`stagiaire_${idx}_email`] && <span className="error-text">Ce champ est requis</span>}'
)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)

with open(css_path, 'a', encoding='utf-8') as f:
    f.write('''\n
.error-text {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}
.input-error {
  border-color: #ef4444 !important;
  background-color: #fef2f2 !important;
}
''')
print('DONE')
