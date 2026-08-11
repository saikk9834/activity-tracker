import { useContext } from 'react';
import { FeedbackContext, type Feedback } from './FeedbackProvider';

export function useFeedback(): Feedback {
  const feedback = useContext(FeedbackContext);
  if (!feedback) throw new Error('useFeedback must be used inside <FeedbackProvider>');
  return feedback;
}
