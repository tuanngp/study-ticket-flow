// Test script for AI triage with educational ticket types
import { TicketService } from './services/ticketService';

const testCases = [
  {
    title: "My assignment grade seems incorrect",
    description: "I submitted my Java project on time but got 0 points. Can you check what went wrong?",
    expectedType: "grading",
    expectedPriority: "high"
  },
  {
    title: "Need help with React hooks implementation",
    description: "I'm working on the PRJ301 assignment and can't figure out how to use useEffect properly.",
    expectedType: "assignment",
    expectedPriority: "medium"
  },
  {
    title: "Can't connect to database in my project",
    description: "Getting connection timeout errors when trying to connect to PostgreSQL from my Spring Boot application.",
    expectedType: "technical",
    expectedPriority: "high"
  },
  {
    title: "Exam submission deadline issue",
    description: "The system won't let me submit my exam answers even though I'm within the time limit.",
    expectedType: "submission",
    expectedPriority: "critical"
  },
  {
    title: "How to configure IntelliJ for Java development",
    description: "I need help setting up IntelliJ IDEA for my Java web development course.",
    expectedType: "config",
    expectedPriority: "medium"
  },
  {
    title: "Report plagiarism in group project",
    description: "I found that one of my group members copied code from online without attribution.",
    expectedType: "report",
    expectedPriority: "high"
  },
  {
    title: "General question about OOP concepts",
    description: "Can you explain the difference between inheritance and composition in object-oriented programming?",
    expectedType: "academic",
    expectedPriority: "low"
  }
];

async function testAITriage() {
  console.log('🧪 Testing AI Triage with Educational Ticket Types...\n');

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}: ${testCase.title}`);
    console.log(`Description: ${testCase.description}`);
    console.log(`Expected: ${testCase.expectedType} | ${testCase.expectedPriority}`);

    try {
      const suggestions = await TicketService.getAITriageSuggestions({
        title: testCase.title,
        description: testCase.description,
        type: "question", // Default type
        priority: "medium"
      });

      if (suggestions) {
        console.log(`AI Suggested: ${suggestions.suggested_type} | ${suggestions.suggested_priority}`);
        
        const typeMatch = suggestions.suggested_type === testCase.expectedType;
        const priorityMatch = suggestions.suggested_priority === testCase.expectedPriority;
        
        console.log(`✅ Type Match: ${typeMatch ? 'YES' : 'NO'}`);
        console.log(`✅ Priority Match: ${priorityMatch ? 'YES' : 'NO'}`);
        
        if (suggestions.analysis) {
          console.log(`Analysis: ${suggestions.analysis}`);
        }
      } else {
        console.log('❌ No AI suggestions received');
      }
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }

    console.log('---\n');
  }
}

// Run the test
testAITriage().catch(console.error);
