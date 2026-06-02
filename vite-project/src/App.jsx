import React, { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Download, MessageCircle, FileText } from 'lucide-react';
import './index.css';

function App() {
  const [selectedDocument, setSelectedDocument] = useState('TB_FORMATIONS');

  const [formData, setFormData] = useState({
    // Champs communs
    raisonSociale: '',
    siret: '',
    nomDirigeant: '',
    telephone: '',
    email: '',
    dateSignature: new Date().toLocaleDateString('fr-FR'),
    ville: '',
    
    // TB FORMATIONS
    adresse: '',
    lieuFormation: '',
    modaliteFormation: 'En présentiel',
    intituleFormation: '',
    dureeHeures: '',
    sanction: 'Feuille de présence signée',
    periodeFormation: '',
    nomsStagiaires: '',
    coutHT: '',
    coutTTC: '',
    reglement: '',
    payeur: 'Entreprise', // ou OPCO
    preRequis: 'Posséder un ordinateur avec un accès internet.',
    objectif1: '',
    objectif2: '',
    objectif3: '',
    objectif4: '',
    objectif5: '',
    objectif6: '',
    publicVise: 'Tout public',

    // CA CONSEILS / GO CONSEILS
    dureeJours: '',
    dateDebut: '',
    dateFin: '',
    modalitePedagogique: 'INTRA',
    formatCours: 'En présentiel', // En présentiel ou En distanciel
    lienConnexion: '',
    tva: '20,00%',
    stagiaires: [{ nom: '', tel: '', email: '' }],
  });

  const today = new Date().toLocaleDateString('fr-FR');
  const [isGenerating, setIsGenerating] = useState(false);
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

    if (Object.keys(newErrors).some(k => k.startsWith('stagiaire_'))) {
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleStagiaireChange = (index, field, value) => {
    const updatedStagiaires = [...formData.stagiaires];
    updatedStagiaires[index][field] = value;
    setFormData((prev) => ({ ...prev, stagiaires: updatedStagiaires }));
  };

  const addStagiaire = () => {
    setFormData((prev) => ({ ...prev, stagiaires: [...prev.stagiaires, { nom: '', tel: '', email: '' }] }));
  };

  const removeStagiaire = (index) => {
    setFormData((prev) => ({
      ...prev,
      stagiaires: prev.stagiaires.filter((_, i) => i !== index)
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Calcul automatique de la TVA si le HT change
      if (name === 'coutHT') {
        const ht = parseFloat(value);
        if (!isNaN(ht)) {
          if (selectedDocument === 'CA_CONSEILS') {
             // CA CONSEILS a TVA non applicable 0% d'après le PDF
             updatedData.coutTTC = ht.toFixed(2);
          } else {
             // 20% par défaut
             updatedData.coutTTC = (ht * 1.2).toFixed(2);
          }
        } else if (value === '') {
          updatedData.coutTTC = '';
        }
      }

      return updatedData;
    });
  };

  // ----- FONCTION DE GENERATION PDF -----
  const generatePDF = async () => {
    if (!validateForm()) {
      alert("Veuillez remplir tous les champs obligatoires en rouge avant de générer le PDF.");
      return;
    }
    setIsGenerating(true);
    try {
      let fileName = '';
      if (selectedDocument === 'TB_FORMATIONS') fileName = 'TB FORMATIONS.pdf';
      else if (selectedDocument === 'CA_CONSEILS') fileName = 'CA CONSEILS.pdf';
      else if (selectedDocument === 'GO_CONSEILS') fileName = 'GO CONSEILS.pdf';

      const existingPdfBytes = await fetch(`/${fileName}`).then((res) => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const pages = pdfDoc.getPages();
      const drawText = (page, text, x, y, size = 10, isBold = false) => {
        if (!text) return;
        page.drawText(text.toString(), {
          x, y, size, font: isBold ? fontBold : font, color: rgb(0, 0, 0),
        });
      };

      // -------------------------------------------------------------
      // ATTENTION : Les coordonnées X et Y ci-dessous sont des ESTIMATIONS.
      // Il faudra faire un test de génération, regarder le résultat, 
      // et ajuster les nombres (x, y) pour que le texte tombe parfaitement sur les lignes.
      // -------------------------------------------------------------

      if (selectedDocument === 'TB_FORMATIONS') {
        const p1 = pages[0]; // TB Formations a 1 seule page
        drawText(p1, formData.raisonSociale, 103, 752);
        drawText(p1, formData.siret, 77, 732);
        drawText(p1, formData.nomDirigeant, 133, 712);
        drawText(p1, formData.lieuFormation, 129, 692);
        drawText(p1, formData.adresse, 140, 671);
        drawText(p1, formData.email, 95, 651);
        
        drawText(p1, formData.modaliteFormation, 437, 751);
        drawText(p1, formData.intituleFormation, 380, 732);
        drawText(p1, `${formData.dureeHeures} heures`, 430, 711);
        drawText(p1, formData.sanction, 370, 691);
        drawText(p1, formData.periodeFormation, 432, 671);
        drawText(p1, formData.telephone, 348, 651);

        drawText(p1, formData.nomsStagiaires, 220, 627);
        
            drawText(p1, formData.coutHT, 160, 605, 10, true);
            drawText(p1, formData.coutTTC, 440, 605, 10, true);
        drawText(p1, formData.reglement, 106, 585);

        drawText(p1, formData.preRequis, 85, 540);
        // 6 objectifs en 2 colonnes (gauche: 1,3,5 / droite: 2,4,6)
        drawText(p1, formData.objectif1, 155, 517);
        drawText(p1, formData.objectif2, 350, 517);
        drawText(p1, formData.objectif3, 155, 503);
        drawText(p1, formData.objectif4, 350, 503);
        drawText(p1, formData.objectif5, 155, 489);
        drawText(p1, formData.objectif6, 350, 489);
        drawText(p1, formData.publicVise, 85, 476);
        
        drawText(p1, formData.ville, 167, 119);
        drawText(p1, formData.nomDirigeant, 60, 150);
      } 
      else if (selectedDocument === 'CA_CONSEILS' || selectedDocument === 'GO_CONSEILS') {
        // Ces deux documents ont la même structure globale (4 pages)
        const p1 = pages[0];
        const p2 = pages[1];
        const p3 = pages[2];
        const p4 = pages[3];

        const isGo = selectedDocument === 'GO_CONSEILS';

        // Page 1
        drawText(p1, formData.siret, 120, isGo ? 560 : 596);
        // drawText(p1, formData.raisonSociale, 290, 630); // Retiré à la demande de l'utilisateur
        drawText(p1, formData.nomDirigeant, 153, isGo ? 540 : 575);
        drawText(p1, formData.telephone, 135, isGo ? 530 : 564);
        drawText(p1, formData.email, 110, isGo ? 520 : 554);
        
        drawText(p1, formData.dureeHeures, 95, isGo ? 376: 406);
        drawText(p1, formData.dureeJours, isGo ? 157 : 158, isGo ? 376 : 406);
        
        // Objectifs individuels (2 colonnes)
        const objY1 = isGo ? 332 : 364;
        const objY2 = isGo ? 311 : 342;
        const objY3 = isGo ? 288 : 319;
        
        if (formData.objectif1) drawText(p1, formData.objectif1, 105, objY1);
        if (formData.objectif2) drawText(p1, formData.objectif2, 105, objY2);
        if (formData.objectif3) drawText(p1, formData.objectif3, 105, objY3);
        
        if (formData.objectif4) drawText(p1, formData.objectif4, 307, objY1);
        if (formData.objectif5) drawText(p1, formData.objectif5, 307, objY2);
        if (formData.objectif6) drawText(p1, formData.objectif6, 307, objY3);

        // Page 2
        formData.stagiaires.forEach((stagiaire, idx) => {
          // Ajustement de l'espacement pour que les lignes rentrent bien dans le tableau (22.5 points)
          const yPos = 666 - (idx * 22.5);
          drawText(p2, stagiaire.nom, 80, yPos);
          drawText(p2, stagiaire.tel, 270, yPos);
          drawText(p2, stagiaire.email, 420, yPos);
        });
        
        const formatDate = (dateStr) => {
          if (!dateStr) return '';
          if (dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('-');
            if (year.length === 4) return `${day}/${month}/${year}`;
          }
          return dateStr;
        };
        
        drawText(p2, formatDate(formData.dateDebut), 230, 383);
        drawText(p2, formatDate(formData.dateFin), 230, 348);
        drawText(p2, formData.modalitePedagogique, 230, 313);
        
        drawText(p2, formData.lieuFormation, 230, 244);
        // Estimation pour Lien de connexion

        // Page 3
        drawText(p3, formData.lienConnexion, 230, 699);
        drawText(p3, formData.coutHT, 200, 380, 10, true);
        // drawText(p3, formData.tva, 400, 365); // Retiré à la demande de l'utilisateur
        drawText(p3, formData.coutTTC, 195, 321, 10, true);

        // Page 4
        drawText(p4, isGo ? formData.ville : formData.dateSignature, 170, 404);
        const commanditaireText = formData.raisonSociale && formData.nomDirigeant 
          ? `${formData.raisonSociale} - ${formData.nomDirigeant}`
          : (formData.raisonSociale || formData.nomDirigeant);
        drawText(p4, commanditaireText, 318, 363, 10, true);
      }

      // Sauvegarde et téléchargement
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Convention_${selectedDocument}_${formData.raisonSociale || 'Client'}.pdf`;
      link.click();

    } catch (error) {
      console.error('Erreur PDF:', error);
      alert('Erreur lors de la génération du PDF. Vérifiez que les fichiers PDF sont bien dans le dossier /public.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ----- FONCTION MESSAGE WHATSAPP -----
  const generateWhatsApp = async () => {
    const message = `
*NOUVELLE CONVENTION - ${selectedDocument.replace('_', ' ')}*
*Date* : ${today}

*1. ENTREPRISE*
*Raison Sociale* : ${formData.raisonSociale || '-'}
*Dirigeant* : ${formData.nomDirigeant || '-'}
*SIRET* : ${formData.siret || '-'}
*Email* : ${formData.email || '-'}
*Tél* : ${formData.telephone || '-'}

*2. FORMATION*
*Intitulé* : ${formData.intituleFormation || formData.formation || '-'}
*Durée* : ${formData.dureeHeures || '-'} Heures
*Stagiaire(s)* : ${formData.nomsStagiaires || '-'}

*3. CONDITIONS FINANCIÈRES*
*Montant HT* : ${formData.coutHT ? formData.coutHT + ' €' : '-'}
*Montant TTC* : ${formData.coutTTC ? formData.coutTTC + ' €' : '-'}
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`app-container animate-fade-in ${selectedDocument.toLowerCase()}-theme`}>
      <div className="header">
        <div className="header-logo" style={{ background: '#ffffff' }}>
          <img 
            src={
              selectedDocument === 'TB_FORMATIONS' ? '/TB FORMATION LOGO.jpg' :
              selectedDocument === 'CA_CONSEILS' ? '/CA CONSEILS LOGO.jpg' :
              '/GO CONSEILS LOGO.jpg'
            } 
            alt="Logo"
          />
        </div>
        <div className="header-content">
          <h1>CONVENTIONS</h1>
          <p style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>De Formation Professionnelle</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem 2.5rem' }}>
        <h2 className="section-title" style={{ marginBottom: '1rem' }}>Choix du Document</h2>
        <div className="form-group">
          <select 
            value={selectedDocument} 
            onChange={(e) => setSelectedDocument(e.target.value)} 
            className="form-input"
            style={{ fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
          >
            <option value="TB_FORMATIONS">TB FORMATIONS</option>
            <option value="CA_CONSEILS">CA CONSEILS</option>
            <option value="GO_CONSEILS">GO CONSEILS</option>
          </select>
        </div>
      </div>

      {selectedDocument === 'TB_FORMATIONS' ? (
        <div className="glass-card">
          <h2 className="section-title">Convention TB FORMATIONS</h2>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label className="form-label">Raison sociale :</label>
              <input type="text" name="raisonSociale" value={formData.raisonSociale} onChange={handleChange} className={`form-input ${errors.raisonSociale ? "input-error" : ""}`} />{errors.raisonSociale && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Modalité de formation :</label>
              <input type="text" name="modaliteFormation" value={formData.modaliteFormation} onChange={handleChange} className={`form-input ${errors.modaliteFormation ? "input-error" : ""}`} />{errors.modaliteFormation && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group">
              <label className="form-label">SIRET :</label>
              <input type="text" name="siret" value={formData.siret} onChange={handleChange} className={`form-input ${errors.siret ? "input-error" : ""}`} />{errors.siret && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Formation :</label>
              <input type="text" name="intituleFormation" value={formData.intituleFormation} onChange={handleChange} className={`form-input ${errors.intituleFormation ? "input-error" : ""}`} />{errors.intituleFormation && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Nom du responsable :</label>
              <input type="text" name="nomDirigeant" value={formData.nomDirigeant} onChange={handleChange} className={`form-input ${errors.nomDirigeant ? "input-error" : ""}`} />{errors.nomDirigeant && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Durée de formation :</label>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <input type="number" name="dureeHeures" value={formData.dureeHeures} onChange={handleChange} className={`form-input ${errors.dureeHeures ? "input-error" : ""}`} style={{flex: 1}} />{errors.dureeHeures && <span className="error-text">Ce champ est obligatoire</span>}
                <span>heures</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lieu de formation :</label>
              <input type="text" name="lieuFormation" value={formData.lieuFormation} onChange={handleChange} className={`form-input ${errors.lieuFormation ? "input-error" : ""}`} />{errors.lieuFormation && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Sanction :</label>
              <input type="text" name="sanction" value={formData.sanction} onChange={handleChange} className={`form-input ${errors.sanction ? "input-error" : ""}`} />{errors.sanction && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Adresse de l'entreprise :</label>
              <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} className={`form-input ${errors.adresse ? "input-error" : ""}`} />{errors.adresse && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Période de formation :</label>
              <input type="text" name="periodeFormation" value={formData.periodeFormation} onChange={handleChange} className={`form-input ${errors.periodeFormation ? "input-error" : ""}`} />{errors.periodeFormation && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Adresse mail :</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={`form-input ${errors.email ? "input-error" : ""}`} />{errors.email && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Tél :</label>
              <input type="text" name="telephone" value={formData.telephone} onChange={handleChange} className={`form-input ${errors.telephone ? "input-error" : ""}`} />{errors.telephone && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Nom(s) et prénom(s) du/des stagiaire(s) :</label>
              <input type="text" name="nomsStagiaires" value={formData.nomsStagiaires} onChange={handleChange} className={`form-input ${errors.nomsStagiaires ? "input-error" : ""}`} />{errors.nomsStagiaires && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Montant HT :</label>
              <input type="number" name="coutHT" value={formData.coutHT} onChange={handleChange} className={`form-input bold-number ${errors.coutHT ? "input-error" : ""}`} />{errors.coutHT && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Total TTC :</label>
              <input type="number" name="coutTTC" value={formData.coutTTC} readOnly className="form-input bold-number" style={{ backgroundColor: '#f3f4f6' }} />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Règlement :</label>
              <input type="text" name="reglement" value={formData.reglement} onChange={handleChange} className={`form-input ${errors.reglement ? "input-error" : ""}`} />{errors.reglement && <span className="error-text">Ce champ est obligatoire</span>}
            </div>


            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Prérequis :</label>
              <input type="text" name="preRequis" value={formData.preRequis} onChange={handleChange} className={`form-input ${errors.preRequis ? "input-error" : ""}`} />{errors.preRequis && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>Objectifs de formation :</label>
              <div className="form-grid two-cols" style={{ gap: '0.75rem' }}>
                <input type="text" name="objectif1" value={formData.objectif1} onChange={handleChange} className={`form-input ${errors.objectif1 ? "input-error" : ""}`} placeholder="Objectif 1" />{errors.objectif1 && <span className="error-text">Ce champ est obligatoire</span>}
                <input type="text" name="objectif2" value={formData.objectif2} onChange={handleChange} className="form-input" placeholder="Objectif 2" />
                <input type="text" name="objectif3" value={formData.objectif3} onChange={handleChange} className="form-input" placeholder="Objectif 3" />
                <input type="text" name="objectif4" value={formData.objectif4} onChange={handleChange} className="form-input" placeholder="Objectif 4" />
                <input type="text" name="objectif5" value={formData.objectif5} onChange={handleChange} className="form-input" placeholder="Objectif 5" />
                <input type="text" name="objectif6" value={formData.objectif6} onChange={handleChange} className="form-input" placeholder="Objectif 6" />
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Public visé :</label>
              <input type="text" name="publicVise" value={formData.publicVise} onChange={handleChange} className={`form-input ${errors.publicVise ? "input-error" : ""}`} />{errors.publicVise && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Fait en double exemplaire, à :</label>
              <input type="text" name="ville" value={formData.ville} onChange={handleChange} className={`form-input ${errors.ville ? "input-error" : ""}`} placeholder="Ex: Paris" />{errors.ville && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card">
          <h2 className="section-title">Convention {selectedDocument.replace('_', ' ')}</h2>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label className="form-label">N° SIRET :</label>
              <input type="text" name="siret" value={formData.siret} onChange={handleChange} className={`form-input ${errors.siret ? "input-error" : ""}`} />{errors.siret && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Raison sociale :</label>
              <input type="text" name="raisonSociale" value={formData.raisonSociale} onChange={handleChange} className={`form-input ${errors.raisonSociale ? "input-error" : ""}`} />{errors.raisonSociale && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Nom du dirigeant :</label>
              <input type="text" name="nomDirigeant" value={formData.nomDirigeant} onChange={handleChange} className={`form-input ${errors.nomDirigeant ? "input-error" : ""}`} />{errors.nomDirigeant && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone :</label>
              <input type="text" name="telephone" value={formData.telephone} onChange={handleChange} className={`form-input ${errors.telephone ? "input-error" : ""}`} />{errors.telephone && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Adresse mail :</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={`form-input ${errors.email ? "input-error" : ""}`} />{errors.email && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Durée en heures :</label>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <input type="number" name="dureeHeures" value={formData.dureeHeures} onChange={handleChange} className={`form-input ${errors.dureeHeures ? "input-error" : ""}`} style={{flex: 1}} />{errors.dureeHeures && <span className="error-text">Ce champ est obligatoire</span>}
                <span>heures</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Durée en jours :</label>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <input type="number" name="dureeJours" value={formData.dureeJours} onChange={handleChange} className={`form-input ${errors.dureeJours ? "input-error" : ""}`} style={{flex: 1}} />{errors.dureeJours && <span className="error-text">Ce champ est obligatoire</span>}
                <span>jours</span>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem' }}>Objectifs de formation :</label>
              <div className="form-grid two-cols" style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '1rem' }}>
                {/* Colonne gauche */}
                <input type="text" name="objectif1" value={formData.objectif1} onChange={handleChange} className={`form-input ${errors.objectif1 ? "input-error" : ""}`} placeholder="• Objectif 1" style={{ marginBottom: 0 }} />{errors.objectif1 && <span className="error-text">Ce champ est obligatoire</span>}
                {/* Colonne droite */}
                <input type="text" name="objectif4" value={formData.objectif4} onChange={handleChange} className="form-input" placeholder="• Objectif 4" style={{ marginBottom: 0 }} />

                <input type="text" name="objectif2" value={formData.objectif2} onChange={handleChange} className="form-input" placeholder="• Objectif 2" style={{ marginBottom: 0 }} />
                <input type="text" name="objectif5" value={formData.objectif5} onChange={handleChange} className="form-input" placeholder="• Objectif 5" style={{ marginBottom: 0 }} />

                <input type="text" name="objectif3" value={formData.objectif3} onChange={handleChange} className="form-input" placeholder="• Objectif 3" style={{ marginBottom: 0 }} />
                <input type="text" name="objectif6" value={formData.objectif6} onChange={handleChange} className="form-input" placeholder="• Objectif 6" style={{ marginBottom: 0 }} />
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: '1rem', color: '#1e293b' }}>Personnes inscrites à la formation :</label>
                <button type="button" onClick={addStagiaire} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'inline-block' }}>
                  + Ajouter
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formData.stagiaires.map((stagiaire, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>Nom et prénom</span>
                      <input type="text" placeholder="Ex: Jean Dupont" value={stagiaire.nom} onChange={(e) => handleStagiaireChange(idx, 'nom', e.target.value)} className={`form-input ${errors[`stagiaire_${idx}_nom`] ? 'input-error' : ''}`} style={{ marginBottom: 0 }} />
                      {errors[`stagiaire_${idx}_nom`] && <span className="error-text">Ce champ est obligatoire</span>}
                    </div>
                    <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>Téléphone</span>
                      <input type="text" placeholder="Ex: 06 12..." value={stagiaire.tel} onChange={(e) => handleStagiaireChange(idx, 'tel', e.target.value)} className={`form-input ${errors[`stagiaire_${idx}_tel`] ? 'input-error' : ''}`} style={{ marginBottom: 0 }} />
                      {errors[`stagiaire_${idx}_tel`] && <span className="error-text">Ce champ est obligatoire</span>}
                    </div>
                    <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>Email</span>
                      <input type="email" placeholder="Ex: mail@..." value={stagiaire.email} onChange={(e) => handleStagiaireChange(idx, 'email', e.target.value)} className={`form-input ${errors[`stagiaire_${idx}_email`] ? 'input-error' : ''}`} style={{ marginBottom: 0 }} />
                      {errors[`stagiaire_${idx}_email`] && <span className="error-text">Ce champ est obligatoire</span>}
                    </div>
                    {formData.stagiaires.length > 1 && (
                      <button type="button" onClick={() => removeStagiaire(idx)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.25rem', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.5rem', alignSelf: 'flex-end', flexShrink: 0 }} title="Supprimer ce stagiaire">
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Date de début :</label>
              <input type="date" name="dateDebut" value={formData.dateDebut} onChange={handleChange} className={`form-input ${errors.dateDebut ? "input-error" : ""}`} />{errors.dateDebut && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Date de fin :</label>
              <input type="date" name="dateFin" value={formData.dateFin} onChange={handleChange} className={`form-input ${errors.dateFin ? "input-error" : ""}`} />{errors.dateFin && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Modalité pédagogique :</label>
              <input type="text" name="modalitePedagogique" value={formData.modalitePedagogique} onChange={handleChange} className={`form-input ${errors.modalitePedagogique ? "input-error" : ""}`} placeholder="Ex: INTRA" />{errors.modalitePedagogique && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Lieu de formation :</label>
              <input type="text" name="lieuFormation" value={formData.lieuFormation} onChange={handleChange} className={`form-input ${errors.lieuFormation ? "input-error" : ""}`} />{errors.lieuFormation && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Lien de connexion :</label>
              <input type="text" name="lienConnexion" value={formData.lienConnexion} onChange={handleChange} className={`form-input ${errors.lienConnexion ? "input-error" : ""}`} />{errors.lienConnexion && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Montant HT :</label>
              <input type="number" name="coutHT" value={formData.coutHT} onChange={handleChange} className={`form-input bold-number ${errors.coutHT ? "input-error" : ""}`} />{errors.coutHT && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
            <div className="form-group">
              <label className="form-label">TVA :</label>
              <input type="text" name="tva" value={selectedDocument === 'CA_CONSEILS' ? '0,00%' : '20,00%'} readOnly className="form-input" style={{ backgroundColor: '#f3f4f6' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Total TTC :</label>
              <input type="number" name="coutTTC" value={formData.coutTTC} readOnly className="form-input bold-number" style={{ backgroundColor: '#f3f4f6' }} />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Ville :</label>
              <input type="text" name="ville" value={formData.ville} onChange={handleChange} className={`form-input ${errors.ville ? "input-error" : ""}`} placeholder="Ex: Paris" />{errors.ville && <span className="error-text">Ce champ est obligatoire</span>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Date :</label>
              <input type="text" name="dateSignature" value={formData.dateSignature} onChange={handleChange} className={`form-input ${errors.dateSignature ? "input-error" : ""}`} />{errors.dateSignature && <span className="error-text">Ce champ est obligatoire</span>}
            </div>
          </div>
        </div>
      )}

      <div className="actions-container">
        <button onClick={generatePDF} disabled={isGenerating} className="btn btn-primary">
          {isGenerating ? <div className="loading-spinner" /> : <Download size={20} />}
          {isGenerating ? 'Génération du document...' : 'Générer le PDF'}
        </button>
        
        <button onClick={generateWhatsApp} className="btn btn-whatsapp">
          <MessageCircle size={20} />
          Préparer le message WhatsApp
        </button>
      </div>
    </div>
  );
}

export default App;
