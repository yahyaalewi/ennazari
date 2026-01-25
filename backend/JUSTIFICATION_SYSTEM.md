# Système de Justification d'Absence

## Fonctionnalités Implémentées

### 1. **Modèle de Données (Absence.js)**
Nouveaux champs ajoutés :
- `justificationDocument` : Chemin vers le document uploadé (PDF, image, etc.)
- `justificationStatus` : Statut ('none', 'pending', 'approved', 'rejected')
- `justificationSubmittedAt` : Date de soumission par l'étudiant
- `justificationReviewedBy` : ID du manager qui a validé/rejeté
- `justificationReviewedAt` : Date de validation/rejet
- `justificationReviewComment` : Commentaire du manager

### 2. **API Endpoints**

#### Pour les Étudiants :
**POST /api/absences/:id/submit-justification**
- Permet à un étudiant de soumettre une justification
- Peut inclure un document (PDF, JPG, PNG, DOC, DOCX)
- Change le statut à 'pending'
- Limite de fichier : 5MB

Exemple de requête :
```javascript
const formData = new FormData();
formData.append('justificationReason', 'Certificat médical');
formData.append('document', file); // optionnel

fetch('/api/absences/123/submit-justification', {
  method: 'PATCH',
  headers: { 'Authorization': 'Bearer token' },
  body: formData
});
```

#### Pour les Managers :
**GET /api/absences/pending-justifications**
- Liste toutes les justifications en attente de validation
- Triées par date de soumission (plus récentes en premier)

**PATCH /api/absences/:id/review-justification**
- Permet au manager d'approuver ou rejeter une justification
- Body : `{ status: 'approved' | 'rejected', comment: 'Commentaire optionnel' }`

Exemple :
```javascript
fetch('/api/absences/123/review-justification', {
  method: 'PATCH',
  headers: { 
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'approved',
    comment: 'Certificat médical valide'
  })
});
```

### 3. **Workflow**

1. **Étudiant** : Voit ses absences et peut soumettre une justification
   - Ajoute une raison
   - Upload un document (optionnel)
   - Statut passe à 'pending'

2. **Manager** : Reçoit les justifications en attente
   - Voit la liste des justifications 'pending'
   - Peut télécharger le document joint
   - Approuve ou rejette avec un commentaire
   - Si approuvé : `justified = true`, `justificationStatus = 'approved'`
   - Si rejeté : `justified = false`, `justificationStatus = 'rejected'`

### 4. **Sécurité**
- Étudiant ne peut justifier que ses propres absences
- Seuls les managers peuvent valider/rejeter
- Upload de fichiers sécurisé avec validation de type et limite de taille
- Documents stockés dans `uploads/justifications/`

### 5. **Prochaines Étapes Frontend**
Pour implémenter l'interface utilisateur, vous aurez besoin de :

1. **Page Étudiant - Absences** :
   - Afficher les absences avec leur statut de justification
   - Bouton "Justifier" pour les absences non justifiées
   - Modal/formulaire pour soumettre raison + document
   - Badges de statut (En attente, Approuvée, Rejetée)

2. **Page Manager - Justifications** :
   - Liste des justifications en attente
   - Détails de chaque justification (étudiant, matière, date, raison)
   - Lien pour télécharger le document
   - Boutons Approuver/Rejeter avec champ commentaire

## Fichiers Modifiés
- ✅ `backend/src/models/Absence.js`
- ✅ `backend/src/controllers/absenceController.js`
- ✅ `backend/src/routes/absenceRoutes.js`

## Test des Endpoints

### Tester la soumission (Étudiant)
```bash
# Avec document
curl -X PATCH http://localhost:5000/api/absences/ABSENCE_ID/submit-justification \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -F "justificationReason=Certificat médical" \
  -F "document=@/path/to/file.pdf"

# Sans document
curl -X PATCH http://localhost:5000/api/absences/ABSENCE_ID/submit-justification \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"justificationReason":"Raison familiale"}'
```

### Tester la validation (Manager)
```bash
# Approuver
curl -X PATCH http://localhost:5000/api/absences/ABSENCE_ID/review-justification \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","comment":"Document valide"}'

# Rejeter
curl -X PATCH http://localhost:5000/api/absences/ABSENCE_ID/review-justification \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"rejected","comment":"Document illisible"}'
```

### Lister les justifications en attente (Manager)
```bash
curl http://localhost:5000/api/absences/pending-justifications \
  -H "Authorization: Bearer MANAGER_TOKEN"
```
