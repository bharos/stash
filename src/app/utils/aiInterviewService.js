class AIInterviewService {
  constructor() {
    this.ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
    this.model = process.env.OLLAMA_MODEL || 'mistral:latest';
  }

  // Add method to validate and filter user input
  async validateAndFilterInput(userResponse, currentQuestion, template) {
    // Check if required parameters exist
    if (!currentQuestion || !currentQuestion.text || !template) {
      console.error('Invalid parameters for validateAndFilterInput:', { 
        hasCurrentQuestion: !!currentQuestion,
        hasQuestionText: currentQuestion && !!currentQuestion.text,
        hasTemplate: !!template
      });
      
      return {
        isValid: true, // Default to valid to avoid blocking the interview flow
        filteredResponse: userResponse,
        redirectMessage: null
      };
    }
    
    // Check for very short responses that might be junk
    if (userResponse.trim().length < 10) {
      return {
        isValid: false,
        filteredResponse: userResponse,
        redirectMessage: "I notice your response is quite brief. Could you please provide more detail about your approach to this system design question? I'm looking for your thought process and technical reasoning."
      };
    }

    // Check for non-ASCII characters or obvious junk text
    const junkPattern = /^[^a-zA-Z0-9\s.,!?;:'"()-]+$|^[a-zA-Z]{20,}$|^[0-9]{10,}$/;
    if (junkPattern.test(userResponse.trim())) {
      return {
        isValid: false,
        filteredResponse: userResponse,
        redirectMessage: "I didn't understand that response. Let's focus on the interview question. Could you please explain your approach to designing this system?"
      };
    }

    // Use AI to determine if response is relevant to system design
    const relevancePrompt = `Analyze if this response is relevant to a system design interview question:

INTERVIEW QUESTION: ${currentQuestion.text}
INTERVIEW TOPIC: ${template.title || "System Design Interview"}
CANDIDATE RESPONSE: "${userResponse}"

Determine if the response:
1. Addresses system design concepts
2. Shows technical thinking
3. Is relevant to the question asked
4. Contains meaningful content (not just casual conversation)

Respond with only a JSON object:
{"isRelevant": true/false, "reason": "brief explanation", "suggestedRedirect": "helpful redirect message if not relevant"}

JSON Response:`;

    try {
      const relevanceResponse = await this.callOllama(relevancePrompt, 150);
      const relevanceAnalysis = this.parseAIResponse(relevanceResponse);
      
      if (!relevanceAnalysis.isRelevant) {
        return {
          isValid: false,
          filteredResponse: userResponse,
          redirectMessage: relevanceAnalysis.suggestedRedirect || 
            "That's interesting, but let's focus on the technical aspects of this system design challenge. Could you walk me through how you would approach building this system?"
        };
      }

      return {
        isValid: true,
        filteredResponse: userResponse,
        redirectMessage: null
      };

    } catch (error) {
      console.error('Error validating input relevance:', error);
      
      // Fallback validation using simple keywords
      const systemDesignKeywords = [
        'system', 'design', 'architecture', 'database', 'server', 'client', 'api', 'service',
        'scalability', 'performance', 'load', 'cache', 'storage', 'network', 'protocol',
        'microservice', 'monolith', 'distributed', 'availability', 'consistency', 'partition',
        'sql', 'nosql', 'redis', 'cdn', 'queue', 'message', 'stream', 'batch', 'real-time',
        'users', 'data', 'request', 'response', 'latency', 'throughput', 'bottleneck'
      ];

      const hasRelevantKeywords = systemDesignKeywords.some(keyword => 
        userResponse.toLowerCase().includes(keyword)
      );

      if (!hasRelevantKeywords && userResponse.length > 20) {
        return {
          isValid: false,
          filteredResponse: userResponse,
          redirectMessage: "I appreciate the response, but let's focus on the technical system design aspects. Could you explain how you would architect this solution? Think about components, data flow, and scalability."
        };
      }

      return {
        isValid: true,
        filteredResponse: userResponse,
        redirectMessage: null
      };
    }
  }

  parseAIResponse(response) {
    try {
      // First try direct JSON parse
      return JSON.parse(response);
    } catch (error) {
      console.log('Direct JSON parse failed, trying to extract JSON...');
      
      try {
        // Try to find JSON object in the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let jsonStr = jsonMatch[0];
          
          // If the JSON appears to be truncated (missing closing bracket/quote), try to fix it
          if (!jsonStr.endsWith('}')) {
            // Try to close incomplete arrays or strings
            if (jsonStr.includes('"hints": [')) {
              // If hints array is incomplete, close it properly
              const hintsStart = jsonStr.indexOf('"hints": [');
              const afterHints = jsonStr.substring(hintsStart + 10);
              if (!afterHints.includes(']}')) {
                // Close the incomplete hints array
                jsonStr = jsonStr.replace(/,\s*$/, '') + ']}';
              }
            }
            // Ensure it ends with closing brace
            if (!jsonStr.endsWith('}')) {
              jsonStr += '}';
            }
          }
          
          return JSON.parse(jsonStr);
        }
      } catch (extractError) {
        console.log('JSON extraction failed, trying to fix malformed JSON...');
      }

      try {
        // Try to fix common JSON issues
        let fixedResponse = response
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to keys
          .replace(/:\s*([^",\]\}]+)([,\]\}])/g, ':"$1"$2') // Add quotes to values
          .replace(/,"([^"]*)":/g, ',"$1":') // Fix over-quoted keys
          .replace(/:\s*"(\d+)"/g, ':$1') // Remove quotes from numbers
          .replace(/:\s*"(true|false)"/g, ':$1') // Remove quotes from booleans
          .replace(/\n/g, '') // Remove newlines
          .trim();

        // Handle truncated hints array specifically
        if (fixedResponse.includes('"hints": [') && !fixedResponse.includes(']}')) {
          fixedResponse = fixedResponse.replace(/,\s*$/, '') + ']}';
        }

        return JSON.parse(fixedResponse);
      } catch (fixError) {
        console.log('JSON fixing failed, using fallback response...');
        
        // Fallback: try to extract values manually with better parsing
        const completionMatch = response.match(/["']?completion["']?\s*:\s*(\d+)/i);
        const readyMatch = response.match(/["']?readyForNext["']?\s*:\s*(true|false)/i);
        
        // Extract hints more robustly
        let hints = [];
        const hintsMatch = response.match(/["']?hints["']?\s*:\s*\[(.*?)(?:\]|$)/is);
        if (hintsMatch) {
          try {
            const hintsContent = hintsMatch[1];
            // Extract individual hints from the array content
            const hintMatches = hintsContent.match(/"([^"]+)"/g);
            if (hintMatches) {
              hints = hintMatches.map(h => h.replace(/"/g, ''));
            }
          } catch (e) {
            hints = ['Continue with current approach', 'Consider system components'];
          }
        }

        return {
          completion: completionMatch ? parseInt(completionMatch[1]) : 65,
          readyForNext: readyMatch ? readyMatch[1] === 'true' : false, // Changed default to false for safety
          hints: hints.length > 0 ? hints : ['Continue with current approach', 'Add more technical details']
        };
      }
    }
  }

  analyzeDiagram(elements) {
    if (!elements || elements.length === 0) {
      return {
        componentCount: 0,
        hasDataStores: false,
        hasLoadBalancers: false,
        hasAPIs: false,
        hasConnections: false,
        missingComponents: ['database', 'load balancer', 'API gateway', 'cache'],
        relationships: []
      };
    }

    const textElements = elements.filter(el => el.type === 'text');
    const rectangles = elements.filter(el => el.type === 'rectangle');
    const arrows = elements.filter(el => el.type === 'arrow');
    const diamonds = elements.filter(el => el.type === 'diamond');

    // Analyze text content for system components
    const allText = textElements.map(el => el.text?.toLowerCase() || '').join(' ');
    
    const hasDataStores = /database|db|mysql|postgres|mongo|redis|cache|storage/.test(allText);
    const hasLoadBalancers = /load.?balancer|lb|nginx|haproxy|alb/.test(allText);
    const hasAPIs = /api|rest|graphql|endpoint|service|microservice/.test(allText);
    const hasQueue = /queue|kafka|rabbitmq|sqs|pubsub/.test(allText);
    const hasCDN = /cdn|cloudfront|cloudflare/.test(allText);

    const missingComponents = [];
    if (!hasDataStores) missingComponents.push('database/storage layer');
    if (!hasLoadBalancers && rectangles.length > 3) missingComponents.push('load balancer');
    if (!hasAPIs) missingComponents.push('API layer');
    if (!hasQueue && rectangles.length > 5) missingComponents.push('message queue');
    if (!hasCDN) missingComponents.push('CDN for static content');

    return {
      componentCount: rectangles.length + diamonds.length,
      hasDataStores,
      hasLoadBalancers,
      hasAPIs,
      hasConnections: arrows.length > 0,
      missingComponents,
      relationships: [`${arrows.length} connections between components`]
    };
  }

  determineDesignStage(userResponse, diagramAnalysis) {
    const response = userResponse.toLowerCase();
    
    if (response.includes('user') || response.includes('requirement') || response.includes('feature')) {
      return 'requirements_gathering';
    }
    
    if (diagramAnalysis.componentCount <= 3 && !diagramAnalysis.hasConnections) {
      return 'high_level_design';
    }
    
    if (diagramAnalysis.componentCount > 3 && diagramAnalysis.hasConnections) {
      return 'detailed_design';
    }
    
    if (response.includes('scale') || response.includes('traffic') || response.includes('performance')) {
      return 'scalability_discussion';
    }
    
    if (response.includes('database') || response.includes('schema') || diagramAnalysis.hasDataStores) {
      return 'database_design';
    }
    
    return 'initial_discussion';
  }

  async callOllama(prompt, maxTokens = 300) {
    try {
      console.log(`Calling Ollama with prompt: ${prompt.substring(0, 100)}...`); // Show first 100 chars
      console.log(`Full prompt length: ${prompt.length} characters`); // Show total length
      console.log(`Max tokens: ${maxTokens}`);
      
      const response = await fetch(this.ollamaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.3, // Lower temperature for more consistent JSON
            num_predict: maxTokens,
            stop: [] // Remove stop tokens to get full response
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Ollama API error: ${response.status} - ${errorText}`);
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Ollama response: ${data.response}`);
      return data.response.trim(); // Trim whitespace
    } catch (error) {
      console.error('Error calling Ollama:', error);
      // Fallback response when Ollama is not available
      return this.getFallbackResponse(prompt);
    }
  }

  getFallbackResponse(prompt) {
    // Simple fallback responses for testing when Ollama is not available
    if (prompt.includes('follow-up') || prompt.includes('question')) {
      return "That's a good point! Can you elaborate on how you would handle scalability in that component? Also, consider drawing the key components in your diagram.";
    }
    if (prompt.includes('evaluate') || prompt.includes('criteria') || prompt.includes('JSON Response:')) {
      // Return more reasonable defaults - allow progression after reasonable interaction
      return JSON.stringify({
        completion: 75,
        readyForNext: true, // Change to true to allow progression
        hints: ["Consider adding more detail", "Think about scalability", "Add database design"]
      });
    }
    if (prompt.includes('suggestions') || prompt.includes('diagram')) {
      return JSON.stringify(["Add a load balancer", "Consider caching layer", "Label your components clearly"]);
    }
    return "Great explanation! Can you tell me more about how you would implement that at scale?";
  }

  async generateContextualFollowUp(template, currentQuestion, userResponse, diagramElements, conversationHistory) {
    const diagramAnalysis = this.analyzeDiagram(diagramElements);
    const designStage = this.determineDesignStage(userResponse, diagramAnalysis);
    
    const contextPrompt = `You are conducting a system design interview. 

CURRENT QUESTION: ${currentQuestion.text}
EVALUATION CRITERIA: ${currentQuestion.evaluationCriteria.join(', ')}

CANDIDATE'S RESPONSE: "${userResponse}"

DIAGRAM ANALYSIS:
- Components drawn: ${diagramAnalysis.componentCount}
- Has database/storage: ${diagramAnalysis.hasDataStores}
- Has load balancer: ${diagramAnalysis.hasLoadBalancers}
- Has API layer: ${diagramAnalysis.hasAPIs}
- Has connections: ${diagramAnalysis.hasConnections}
- Missing components: ${diagramAnalysis.missingComponents.join(', ')}
- Current stage: ${designStage}

CONVERSATION HISTORY: ${conversationHistory.slice(-3).map(h => h.content).join('\n')}

Based on their response and diagram, ask ONE specific follow-up question that:
1. Builds on what they've already designed
2. Addresses missing components if relevant
3. Probes deeper into scalability/trade-offs
4. Guides them to the next logical step

Keep it conversational and encouraging. If they haven't started drawing, encourage them to sketch while explaining.`;

    return await this.callOllama(contextPrompt, 200);
  }

  // Method to intelligently determine if we should advance to next question
  shouldAdvanceToNextQuestion(currentQuestionIndex, template, allInteractions, diagramAnalysis, evaluation) {
    const currentQuestion = template.questions[currentQuestionIndex];
    
    // Get interactions for current question
    const currentQuestionInteractions = allInteractions.filter(i => 
      i.message_type === 'user_response' && 
      (i.metadata?.question_index === currentQuestionIndex || 
       allInteractions.indexOf(i) >= allInteractions.findIndex(int => int.metadata?.question_index === currentQuestionIndex))
    );

    // Count user responses for this question
    const userResponseCount = currentQuestionInteractions.length;
    
    // Advanced logic for progression
    const reasons = [];
    let shouldAdvance = false;

    // 1. If AI evaluation says ready and has good completion score
    if (evaluation.readyForNext && evaluation.completion >= 70) {
      shouldAdvance = true;
      reasons.push('AI evaluation indicates readiness');
    }

    // 2. If user has provided sufficient interaction (3+ responses) and decent completion
    if (userResponseCount >= 3 && evaluation.completion >= 60) {
      shouldAdvance = true;
      reasons.push('Sufficient user interaction');
    }

    // 3. If they've addressed key evaluation criteria (check last responses)
    const recentResponses = currentQuestionInteractions.slice(-2).map(i => i.content).join(' ').toLowerCase();
    const criteriaAddressed = currentQuestion.evaluationCriteria.filter(criteria => 
      recentResponses.includes(criteria.toLowerCase()) ||
      recentResponses.includes(criteria.replace(/\s+/g, ''))
    ).length;
    
    if (criteriaAddressed >= Math.floor(currentQuestion.evaluationCriteria.length * 0.6)) {
      shouldAdvance = true;
      reasons.push('Key criteria addressed');
    }

    // 4. If diagram shows reasonable progress (for later questions)
    if (currentQuestionIndex >= 1 && diagramAnalysis.componentCount >= 3 && diagramAnalysis.hasConnections) {
      shouldAdvance = true;
      reasons.push('Diagram shows progress');
    }

    // 5. Emergency advancement - prevent getting stuck (5+ responses on same question)
    if (userResponseCount >= 5) {
      shouldAdvance = true;
      reasons.push('Emergency advancement to prevent stalling');
    }

    console.log(`Advancement decision for question ${currentQuestionIndex + 1}:`, {
      shouldAdvance,
      reasons,
      userResponseCount,
      criteriaAddressed,
      evaluationScore: evaluation.completion,
      aiReady: evaluation.readyForNext
    });

    return shouldAdvance;
  }

  async generateQuestionBasedOnTemplate(template, currentQuestionIndex, userResponse, diagramElements, allInteractions) {
    // Validate template and currentQuestionIndex
    if (!template || !template.questions || !Array.isArray(template.questions)) {
      console.error('Invalid template structure:', template);
      return {
        nextQuestion: "I'm sorry, but there was an error with the interview template. Please try again or contact support.",
        shouldAdvance: false,
        hints: [],
        isError: true
      };
    }
    
    // Ensure currentQuestionIndex is valid
    if (currentQuestionIndex < 0 || currentQuestionIndex >= template.questions.length) {
      console.error(`Invalid question index: ${currentQuestionIndex}. Template has ${template.questions.length} questions.`);
      return {
        nextQuestion: "I'm sorry, but I couldn't find the next question. Let's complete the interview now.",
        shouldAdvance: false,
        hints: [],
        isComplete: true
      };
    }
    
    const currentQuestion = template.questions[currentQuestionIndex];
    
    // Verify currentQuestion has the expected structure
    if (!currentQuestion || !currentQuestion.text) {
      console.error('Invalid question structure:', currentQuestion);
      return {
        nextQuestion: "I'm sorry, but there was an error with the current question. Let's move on to the next one.",
        shouldAdvance: true,
        hints: []
      };
    }
    
    const diagramAnalysis = this.analyzeDiagram(diagramElements);
    
    // First, validate and filter the user input
    const inputValidation = await this.validateAndFilterInput(userResponse, currentQuestion, template);
    
    // If input is not valid/relevant, redirect back to the question
    if (!inputValidation.isValid) {
      return {
        nextQuestion: inputValidation.redirectMessage,
        shouldAdvance: false,
        hints: ["Focus on technical system design concepts", "Think about architecture, scalability, and data flow"]
      };
    }

    // Use the filtered response for further processing
    const processedResponse = inputValidation.filteredResponse;
    
    console.log(`=== Question Processing Debug ===`);
    console.log(`Current question index: ${currentQuestionIndex} of ${template.questions.length}`);
    console.log(`Current question: ${currentQuestion.text.substring(0, 100)}...`);
    console.log(`Total interactions: ${allInteractions.length}`);
    console.log(`User responses: ${allInteractions.filter(i => i.message_type === 'user_response').length}`);
    console.log(`Diagram components: ${diagramAnalysis.componentCount}`);
    
    // Check if current question criteria are met
    const criteriaPrompt = `Evaluate if the candidate has addressed the key points for this question:

QUESTION: ${currentQuestion.text}
REQUIRED CRITERIA: ${currentQuestion.evaluationCriteria.join(', ')}

CANDIDATE'S RESPONSES: ${allInteractions
  .filter(i => i.message_type === 'user_response')
  .slice(-3)
  .map(i => i.content)
  .join('\n')}

CURRENT RESPONSE: ${processedResponse}

DIAGRAM STATUS: 
- ${diagramAnalysis.componentCount} components drawn
- Missing: ${diagramAnalysis.missingComponents.join(', ')}

Rate completion (0-100) and determine if ready for next question.
Provide specific hints for missing elements.

IMPORTANT: Respond with ONLY a valid JSON object. No additional text.
Example format:
{"completion": 85, "readyForNext": true, "hints": ["Add caching layer", "Consider load balancing"]}

JSON Response:`;

    try {
      // Use a simpler, more focused prompt for JSON generation with increased token limit
      const jsonPrompt = `Evaluate this system design interview response and respond with ONLY valid JSON:

QUESTION: ${currentQuestion.text}
RESPONSE: ${processedResponse}
DIAGRAM: ${diagramAnalysis.componentCount} components

Rate completion 0-100, determine if ready for next question, provide 2-3 short hints.

JSON format (no other text):
{"completion": 75, "readyForNext": true, "hints": ["hint1", "hint2"]}`;
      
      const evaluationResponse = await this.callOllama(jsonPrompt, 150); // Increased token limit
      console.log('Raw AI evaluation response:', evaluationResponse);
      
      // Try to extract and parse JSON from the response
      const evaluation = this.parseAIResponse(evaluationResponse);
      
      // Use intelligent advancement logic instead of just AI evaluation
      const shouldAdvance = this.shouldAdvanceToNextQuestion(
        currentQuestionIndex, 
        template, 
        allInteractions, 
        diagramAnalysis, 
        evaluation
      );
      
      if (shouldAdvance && currentQuestionIndex < template.questions.length - 1) {
        // Move to next question
        const nextQuestion = template.questions[currentQuestionIndex + 1];
        return {
          nextQuestion: `Great! Let's move on. ${nextQuestion.text}`,
          shouldAdvance: true,
          hints: evaluation.hints || []
        };
      } else if (shouldAdvance && currentQuestionIndex === template.questions.length - 1) {
        // This is the last question and we should complete the interview
        return {
          nextQuestion: "Thank you for completing all the questions! I'll now provide you with comprehensive feedback.",
          shouldAdvance: true,
          hints: [],
          isComplete: true
        };
      } else {
        // Generate follow-up for current question
        const followUp = await this.generateContextualFollowUp(
          template,
          currentQuestion,
          processedResponse,
          diagramElements,
          allInteractions
        );
        
        return {
          nextQuestion: followUp,
          shouldAdvance: false,
          hints: evaluation.hints || []
        };
      }
    } catch (error) {
      console.error('Error parsing AI evaluation:', error);
      // Fallback to simple follow-up
      const followUp = await this.generateContextualFollowUp(
        template,
        currentQuestion,
        processedResponse,
        diagramElements,
        allInteractions
      );
      
      return {
        nextQuestion: followUp,
        shouldAdvance: false,
        hints: []
      };
    }
  }

  async generateDiagramSuggestions(elements, currentQuestion) {
    const diagramAnalysis = this.analyzeDiagram(elements);
    
    const prompt = `Given this system design interview context:

QUESTION: ${currentQuestion.text}
CURRENT DIAGRAM: ${diagramAnalysis.componentCount} components, missing: ${diagramAnalysis.missingComponents.join(', ')}

Provide 3-4 specific suggestions for improving the diagram. Focus on:
1. Missing critical components
2. Missing connections/relationships
3. Labeling improvements
4. Architectural best practices

Return as a JSON array of strings:
["suggestion 1", "suggestion 2", "suggestion 3"]`;

    try {
      const response = await this.callOllama(prompt, 200);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating diagram suggestions:', error);
      return diagramAnalysis.missingComponents.map(comp => `Consider adding: ${comp}`);
    }
  }

  async generateFinalFeedback(sessionData, allInteractions, diagramElements) {
    const template = sessionData.interview_templates;
    const userResponses = allInteractions.filter(i => i.message_type === 'user_response');
    const totalQuestions = template.questions.length;
    const questionsCompleted = sessionData.current_question_index + 1;
    const diagramAnalysis = this.analyzeDiagram(diagramElements || []);
    
    // Calculate comprehensive metrics
    const responseMetrics = this.analyzeResponseQuality(userResponses, template);
    const diagramMetrics = this.analyzeDiagramQuality(diagramAnalysis, template);
    
    const feedbackPrompt = `You are a senior engineering manager conducting a comprehensive evaluation of a system design interview. Provide detailed, actionable feedback that would be given in a real interview at a top tech company.

## INTERVIEW CONTEXT
**Interview Type:** ${template.title}
**Difficulty Level:** ${template.difficulty_level || 'Mid-Level'}
**Questions Asked:** ${questionsCompleted}/${totalQuestions}
**Total Interview Duration:** ${sessionData.created_at ? Math.round((new Date() - new Date(sessionData.created_at)) / (1000 * 60)) : 'N/A'} minutes
**Total Interactions:** ${allInteractions.length}

## CANDIDATE RESPONSES ANALYSIS
**Response Count:** ${userResponses.length}
**Average Response Length:** ${Math.round(userResponses.reduce((sum, r) => sum + r.content.length, 0) / userResponses.length)} characters
**Technical Keywords Used:** ${responseMetrics.technicalKeywords.join(', ')}

**Key Responses:**
${userResponses.map((response, index) => `
**Response ${index + 1}:** "${response.content.substring(0, 200)}..."`).join('\n')}

## DIAGRAM ANALYSIS
**Total Components:** ${diagramAnalysis.componentCount}
**Diagram Completeness:** ${diagramMetrics.completenessScore}/10
**Architectural Soundness:** ${diagramMetrics.architecturalScore}/10

**Components Identified:**
- Data Stores: ${diagramAnalysis.hasDataStores ? '✅' : '❌'}
- Load Balancers: ${diagramAnalysis.hasLoadBalancers ? '✅' : '❌'}
- API/Services: ${diagramAnalysis.hasAPIs ? '✅' : '❌'}
- Connections/Flow: ${diagramAnalysis.hasConnections ? '✅' : '❌'}

**Missing Critical Components:** ${diagramAnalysis.missingComponents.join(', ')}

## EVALUATION CRITERIA ASSESSMENT
${template.questions.map((q, index) => `
**Question ${index + 1}: ${q.text.substring(0, 100)}...**
Evaluation Areas: ${q.evaluationCriteria.join(', ')}
${index < questionsCompleted ? '✅ Addressed' : '❌ Not reached'}
`).join('\n')}

---

# 📊 COMPREHENSIVE INTERVIEW FEEDBACK REPORT

## 🎯 OVERALL PERFORMANCE SUMMARY

**Seniority Level Assessment:** Based on the depth of technical discussion, system design approach, and architectural thinking demonstrated, this performance aligns with a **${this.assessSeniorityLevel(responseMetrics, diagramMetrics, questionsCompleted, totalQuestions)}** level.

**Overall Score:** ${this.calculateOverallScore(responseMetrics, diagramMetrics, questionsCompleted, totalQuestions)}/10

## 💪 STRENGTHS IDENTIFIED

### Technical Communication
- **Clarity of Explanation:** Evaluate how well the candidate explained their thought process
- **Technical Vocabulary:** Usage of appropriate system design terminology
- **Problem Decomposition:** Ability to break down complex requirements

### System Design Approach
- **Requirements Gathering:** Did they ask clarifying questions?
- **Scalability Considerations:** Discussion of load, growth, performance
- **Trade-off Analysis:** Understanding of engineering trade-offs

### Diagram & Visual Design
- **Architectural Clarity:** How well the diagram represents the system
- **Component Organization:** Logical grouping and relationships
- **Detail Level:** Appropriate level of abstraction

## 🎯 AREAS FOR IMPROVEMENT

### Critical Gaps Identified
1. **Architecture Depth:** ${diagramAnalysis.missingComponents.length > 3 ? 'Significant missing components indicate need for deeper architectural thinking' : 'Good component coverage'}
2. **Scalability Discussion:** ${responseMetrics.scalabilityMentions < 2 ? 'Limited discussion of scalability patterns and solutions' : 'Good scalability awareness'}
3. **Data Design:** ${!diagramAnalysis.hasDataStores ? 'Missing data layer considerations - critical for system design' : 'Data layer properly considered'}
4. **Performance Considerations:** ${responseMetrics.performanceMentions < 1 ? 'Need more focus on latency, throughput, and performance optimization' : 'Performance well considered'}

### Specific Technical Recommendations
${this.generateSpecificRecommendations(responseMetrics, diagramAnalysis, template)}

## 📈 SENIORITY LEVEL BREAKDOWN

### For ${this.assessSeniorityLevel(responseMetrics, diagramMetrics, questionsCompleted, totalQuestions)} Level:
**What was demonstrated well:**
${this.getStrengthsForLevel(responseMetrics, diagramMetrics)}

**What could be improved to reach next level:**
${this.getImprovementAreasForNextLevel(responseMetrics, diagramMetrics)}

## 🎓 DETAILED LEARNING RECOMMENDATIONS

### Immediate Focus Areas (Next 2-4 weeks)
1. **System Design Patterns:** Study common patterns like Circuit Breaker, CQRS, Event Sourcing
2. **Scalability Patterns:** Learn about horizontal vs vertical scaling, sharding strategies
3. **Data Architecture:** Practice designing data models and choosing appropriate databases

### Technical Skills to Develop
1. **Distributed Systems:** Understanding of CAP theorem, eventual consistency
2. **Microservices Architecture:** Service decomposition strategies
3. **Performance Engineering:** Caching strategies, CDN usage, optimization techniques

### Practice Recommendations
1. **Mock Interviews:** Practice 2-3 system design problems weekly
2. **Architecture Reviews:** Study real-world system architectures (Netflix, Uber, etc.)
3. **Hands-on Building:** Implement scaled-down versions of systems you design

## 🏆 INDUSTRY COMPARISON

**Compared to typical ${template.difficulty_level || 'Mid-Level'} candidates:**
- Technical depth: ${responseMetrics.technicalDepth >= 7 ? 'Above average' : responseMetrics.technicalDepth >= 5 ? 'Average' : 'Below average'}
- Communication clarity: ${responseMetrics.communicationScore >= 7 ? 'Strong' : responseMetrics.communicationScore >= 5 ? 'Adequate' : 'Needs improvement'}
- Diagram quality: ${diagramMetrics.completenessScore >= 7 ? 'Well structured' : diagramMetrics.completenessScore >= 5 ? 'Basic but functional' : 'Needs significant improvement'}

## 🎯 NEXT STEPS & ACTION PLAN

### Week 1-2: Foundation Building
- Review system design fundamentals
- Study the specific gaps identified above
- Practice drawing architecture diagrams

### Week 3-4: Applied Practice
- Solve 3-5 similar system design problems
- Focus on the specific areas mentioned in recommendations
- Get feedback on diagram clarity and technical explanations

### Month 2+: Advanced Topics
- Deep dive into distributed systems concepts
- Study real-world case studies
- Practice explaining complex trade-offs clearly

---

## 🔍 DETAILED ANALYSIS BREAKDOWN

This interview performance shows ${questionsCompleted === totalQuestions ? 'completion of all planned questions' : `progression through ${questionsCompleted} of ${totalQuestions} questions`}. The candidate demonstrated ${responseMetrics.technicalDepth >= 6 ? 'solid' : responseMetrics.technicalDepth >= 4 ? 'basic' : 'limited'} technical understanding with ${diagramMetrics.architecturalScore >= 6 ? 'good' : diagramMetrics.architecturalScore >= 4 ? 'adequate' : 'weak'} architectural visualization skills.

**Key Technical Insights:**
${this.generateKeyInsights(responseMetrics, diagramAnalysis, userResponses)}

This feedback is designed to provide specific, actionable guidance for professional growth in system design and software architecture.`;

    return await this.callOllama(feedbackPrompt, 2000);
  }

  // Helper methods for comprehensive analysis
  analyzeResponseQuality(responses, template) {
    const allText = responses.map(r => r.content.toLowerCase()).join(' ');
    
    // Technical keyword analysis
    const scalabilityKeywords = ['scale', 'scaling', 'horizontal', 'vertical', 'load', 'performance', 'throughput', 'latency'];
    const systemKeywords = ['database', 'cache', 'api', 'service', 'microservice', 'architecture', 'distributed'];
    const performanceKeywords = ['optimize', 'performance', 'latency', 'throughput', 'bottleneck', 'cdn', 'cache'];
    
    const scalabilityMentions = scalabilityKeywords.filter(kw => allText.includes(kw)).length;
    const systemMentions = systemKeywords.filter(kw => allText.includes(kw)).length;
    const performanceMentions = performanceKeywords.filter(kw => allText.includes(kw)).length;
    
    const technicalKeywords = [...new Set([
      ...scalabilityKeywords.filter(kw => allText.includes(kw)),
      ...systemKeywords.filter(kw => allText.includes(kw)),
      ...performanceKeywords.filter(kw => allText.includes(kw))
    ])];
    
    return {
      scalabilityMentions,
      performanceMentions,
      technicalKeywords,
      technicalDepth: Math.min(10, technicalKeywords.length),
      communicationScore: Math.min(10, Math.round(responses.reduce((sum, r) => sum + r.content.length, 0) / responses.length / 50))
    };
  }

  analyzeDiagramQuality(diagramAnalysis, template) {
    const requiredComponents = ['Load Balancer', 'Database', 'API Server', 'Cache'];
    const presentComponents = requiredComponents.filter(comp => 
      !diagramAnalysis.missingComponents.includes(comp)
    ).length;
    
    const completenessScore = Math.round((presentComponents / requiredComponents.length) * 10);
    const architecturalScore = Math.min(10, 
      (diagramAnalysis.hasConnections ? 3 : 0) +
      (diagramAnalysis.hasDataStores ? 3 : 0) +
      (diagramAnalysis.hasLoadBalancers ? 2 : 0) +
      (diagramAnalysis.hasAPIs ? 2 : 0)
    );
    
    return {
      completenessScore,
      architecturalScore
    };
  }

  assessSeniorityLevel(responseMetrics, diagramMetrics, questionsCompleted, totalQuestions) {
    const score = 
      (responseMetrics.technicalDepth * 0.3) +
      (responseMetrics.communicationScore * 0.2) +
      (diagramMetrics.completenessScore * 0.25) +
      (diagramMetrics.architecturalScore * 0.25);
    
    if (score >= 8 && questionsCompleted === totalQuestions) return 'Senior/Staff';
    if (score >= 6 && questionsCompleted >= totalQuestions * 0.8) return 'Mid-Level/Senior';
    if (score >= 4) return 'Junior/Mid-Level';
    return 'Entry-Level/Junior';
  }

  calculateOverallScore(responseMetrics, diagramMetrics, questionsCompleted, totalQuestions) {
    const completionBonus = (questionsCompleted / totalQuestions) * 2;
    return Math.min(10, Math.round(
      (responseMetrics.technicalDepth * 0.3) +
      (responseMetrics.communicationScore * 0.2) +
      (diagramMetrics.completenessScore * 0.25) +
      (diagramMetrics.architecturalScore * 0.25) +
      completionBonus
    ));
  }

  generateSpecificRecommendations(responseMetrics, diagramAnalysis, template) {
    const recommendations = [];
    
    if (diagramAnalysis.missingComponents.length > 2) {
      recommendations.push('• **Architecture Completeness:** Study end-to-end system design patterns. Missing components suggest gaps in understanding complete system requirements.');
    }
    
    if (responseMetrics.scalabilityMentions < 2) {
      recommendations.push('• **Scalability Focus:** Practice discussing horizontal vs vertical scaling, load distribution strategies, and capacity planning.');
    }
    
    if (!diagramAnalysis.hasDataStores) {
      recommendations.push('• **Data Architecture:** Always include data layer design - database selection, data models, and data flow patterns.');
    }
    
    if (responseMetrics.performanceMentions < 1) {
      recommendations.push('• **Performance Engineering:** Discuss caching strategies, CDN usage, and performance optimization techniques.');
    }
    
    return recommendations.join('\n');
  }

  getStrengthsForLevel(responseMetrics, diagramMetrics) {
    const strengths = [];
    
    if (responseMetrics.technicalDepth >= 6) {
      strengths.push('• Strong technical vocabulary and system design concepts');
    }
    
    if (diagramMetrics.architecturalScore >= 6) {
      strengths.push('• Good architectural visualization and component relationships');
    }
    
    if (responseMetrics.communicationScore >= 6) {
      strengths.push('• Clear communication and explanation of technical concepts');
    }
    
    return strengths.length > 0 ? strengths.join('\n') : '• Review technical fundamentals and practice explaining concepts clearly';
  }

  getImprovementAreasForNextLevel(responseMetrics, diagramMetrics) {
    const improvements = [];
    
    if (responseMetrics.technicalDepth < 7) {
      improvements.push('• Deepen technical knowledge in distributed systems and scalability patterns');
    }
    
    if (diagramMetrics.completenessScore < 7) {
      improvements.push('• Practice drawing complete system architectures with all critical components');
    }
    
    if (responseMetrics.scalabilityMentions < 3) {
      improvements.push('• Focus more on scalability challenges and solutions in discussions');
    }
    
    return improvements.length > 0 ? improvements.join('\n') : '• Continue building on current strong foundation with advanced topics';
  }

  generateKeyInsights(responseMetrics, diagramAnalysis, userResponses) {
    const insights = [];
    
    insights.push(`• Technical communication shows ${responseMetrics.communicationScore >= 7 ? 'strong' : 'developing'} ability to explain complex systems`);
    insights.push(`• Diagram design demonstrates ${diagramAnalysis.componentCount >= 5 ? 'good' : 'basic'} understanding of system components`);
    insights.push(`• Architecture thinking shows ${diagramAnalysis.hasConnections ? 'awareness' : 'limited understanding'} of system relationships`);
    
    return insights.join('\n');
  }
}

module.exports = { AIInterviewService };
