import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where, 
  orderBy, 
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';

/**
 * Service for interacting with Firebase services, primarily Firestore.
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private db: Firestore;

  constructor() {
    this.app = initializeApp(environment.firebase);
    this.db = getFirestore(this.app);
  }

  /**
   * Gets the initialized Firestore database instance.
   * @returns {Firestore} The Firestore database instance.
   */
  get firestore(): Firestore {
    return this.db;
  }

  /**
   * Retrieves all surveys from the database, ordered by creation date descending.
   * @returns {Promise<any[]>} A promise that resolves to an array of surveys.
   */
  async getSurveys(): Promise<any[]> {
    const surveysCol = collection(this.db, 'surveys');
    const q = query(surveysCol, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Retrieves a single survey by its ID.
   * @param {string} id The ID of the survey to retrieve.
   * @returns {Promise<any>} A promise that resolves to the survey data.
   * @throws {Error} If the survey is not found.
   */
  async getSurveyById(id: string): Promise<any> {
    const docRef = doc(this.db, 'surveys', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error('Survey not found');
  }

  /**
   * Retrieves all questions associated with a specific survey ID.
   * Maintains the original order based on the created_at timestamp.
   * @param {string} surveyId The ID of the survey.
   * @returns {Promise<any[]>} A promise that resolves to an array of questions.
   */
  async getQuestions(surveyId: string): Promise<any[]> {
    const questionsCol = collection(this.db, 'questions');
    const q = query(questionsCol, where('survey_id', '==', surveyId));
    const snapshot = await getDocs(q);
    const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return questions.sort((a: any, b: any) => {
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });
  }

  /**
   * Creates a new survey along with its associated questions.
   * Automatically generates IDs and creation timestamps.
   * @param {any} survey The survey data to create.
   * @param {any[]} questions An array of questions associated with the survey.
   * @returns {Promise<any>} A promise that resolves to the newly created survey object.
   */
  async createSurvey(survey: any, questions: any[]): Promise<any> {
    const surveysCol = collection(this.db, 'surveys');
    const surveyRef = doc(surveysCol); 
    const newSurveyId = surveyRef.id;
    
    const now = new Date().toISOString();
    const newSurvey = { 
      ...survey, 
      id: newSurveyId,
      created_at: now
    };
    await setDoc(surveyRef, newSurvey);

    const questionsCol = collection(this.db, 'questions');
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qRef = doc(questionsCol);
      const qTime = new Date(new Date(now).getTime() + i * 100).toISOString();
      const newQ = {
        ...q,
        id: qRef.id,
        survey_id: newSurveyId,
        created_at: qTime
      };
      await setDoc(qRef, newQ);
    }

    return newSurvey;
  }

  /**
   * Updates an existing question with the provided fields.
   * @param {string} id The ID of the question to update.
   * @param {any} updates The fields to update on the question.
   * @returns {Promise<any>} A promise that resolves to the updated question data.
   */
  async updateQuestion(id: string, updates: any): Promise<any> {
    const qRef = doc(this.db, 'questions', id);
    await updateDoc(qRef, updates);
    
    const docSnap = await getDoc(qRef);
    return { id: docSnap.id, ...docSnap.data() };
  }
}
