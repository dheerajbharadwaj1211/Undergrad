// aiEngine.js - AI Module for Undergraduation CRM Dashboard

/**
 * AI Engine for Student CRM Dashboard
 * Provides intelligent insights, recommendations, and analytics
 */

class AIEngine {
  constructor() {
    this.insights = {};
    this.patterns = {};
    this.recommendations = {};
  }

  // ================== STUDENT ANALYSIS ==================

  /**
   * Generate comprehensive AI summary for a student
   * @param {Object} student - Student data object
   * @returns {Object} AI summary with insights
   */
  generateStudentSummary(student) {
    const engagementLevel = this.calculateEngagementLevel(student);
    const riskScore = this.calculateRiskScore(student);
    const intent = this.analyzeIntent(student);
    const nextBestAction = this.getNextBestAction(student);

    return {
      summary: this.createNarrativeSummary(student, engagementLevel, intent),
      engagementLevel,
      riskScore,
      intent,
      nextBestAction,
      keyInsights: this.extractKeyInsights(student),
      urgencyFlags: this.getUrgencyFlags(student)
    };
  }

  /**
   * Calculate student engagement level (0-100)
   */
  calculateEngagementLevel(student) {
    let score = 0;
    const weights = {
      loginFrequency: 25,
      questionsAsked: 20,
      documentsUploaded: 20,
      sessionDuration: 15,
      platformExploration: 10,
      responseRate: 10
    };

    // Login frequency (last 30 days)
    const loginScore = Math.min(student.loginCount30Days * 3, 100);
    score += (loginScore * weights.loginFrequency) / 100;

    // Questions asked to AI
    const questionScore = Math.min(student.aiQuestionsAsked * 5, 100);
    score += (questionScore * weights.questionsAsked) / 100;

    // Documents uploaded
    const docScore = student.documentsUploaded * 25;
    score += Math.min(docScore, weights.documentsUploaded);

    // Average session duration (minutes)
    const sessionScore = Math.min(student.avgSessionDuration * 2, 100);
    score += (sessionScore * weights.sessionDuration) / 100;

    // Platform sections explored
    const explorationScore = (student.sectionsVisited / 10) * 100;
    score += Math.min(explorationScore, weights.platformExploration);

    // Communication response rate
    const responseScore = student.communicationResponseRate * 100;
    score += (responseScore * weights.responseRate) / 100;

    return Math.round(Math.min(score, 100));
  }

  /**
   * Calculate risk score (0-100, higher = more at risk)
   */
  calculateRiskScore(student) {
    let riskScore = 0;

    // Days since last login
    if (student.daysSinceLastLogin > 14) riskScore += 40;
    else if (student.daysSinceLastLogin > 7) riskScore += 20;
    else if (student.daysSinceLastLogin > 3) riskScore += 10;

    // Application stage stagnation
    if (student.daysInCurrentStage > 21) riskScore += 30;
    else if (student.daysInCurrentStage > 14) riskScore += 15;

    // Declining engagement
    if (student.engagementTrend === 'declining') riskScore += 20;

    // No recent communication
    if (student.daysSinceLastContact > 10) riskScore += 10;

    return Math.min(riskScore, 100);
  }

  /**
   * Analyze student intent level
   */
  analyzeIntent(student) {
    const indicators = {
      high: 0,
      medium: 0,
      low: 0
    };

    // High intent indicators
    if (student.documentsUploaded > 2) indicators.high += 2;
    if (student.aiQuestionsAsked > 10) indicators.high += 2;
    if (student.applicationStatus === 'Applying' || student.applicationStatus === 'Submitted') indicators.high += 3;
    if (student.avgSessionDuration > 15) indicators.high += 1;
    if (student.universityShortlist && student.universityShortlist.length > 5) indicators.high += 2;

    // Medium intent indicators
    if (student.applicationStatus === 'Shortlisting') indicators.medium += 2;
    if (student.aiQuestionsAsked > 5) indicators.medium += 1;
    if (student.sectionsVisited > 5) indicators.medium += 1;

    // Low intent indicators
    if (student.applicationStatus === 'Exploring') indicators.low += 1;
    if (student.daysSinceLastLogin > 7) indicators.low += 2;

    const total = indicators.high + indicators.medium + indicators.low;
    if (indicators.high / total > 0.6) return 'High';
    if (indicators.medium / total > 0.5) return 'Medium';
    return 'Low';
  }

  /**
   * Create narrative AI summary
   */
  createNarrativeSummary(student, engagementLevel, intent) {
    const templates = {
      highEngagement: [
        `${student.name} is a highly engaged ${student.grade}th grader from ${student.country} showing strong interest in ${student.interestedMajors?.[0] || 'undecided major'}. With ${student.aiQuestionsAsked} AI interactions and ${student.loginCount30Days} logins this month, they're actively exploring options.`,
        `Active student from ${student.country} in the ${student.applicationStatus.toLowerCase()} stage. Has asked ${student.aiQuestionsAsked} thoughtful questions and uploaded ${student.documentsUploaded} documents. Shows high commitment to the application process.`,
        `${student.name} demonstrates excellent engagement with ${student.loginCount30Days} recent logins and ${student.avgSessionDuration}min average sessions. Currently focused on ${student.applicationStatus.toLowerCase()} and shows ${intent.toLowerCase()} intent to proceed.`
      ],
      mediumEngagement: [
        `${student.name} from ${student.country} shows moderate engagement. In the ${student.applicationStatus.toLowerCase()} stage with ${student.aiQuestionsAsked} AI questions asked. May need additional guidance to maintain momentum.`,
        `Steady progress from this ${student.grade}th grader. ${student.loginCount30Days} logins this month with focus on ${student.interestedMajors?.[0] || 'exploring options'}. Good candidate for targeted follow-up.`,
        `${student.name} is making consistent progress in their college journey. ${student.documentsUploaded} documents uploaded, showing commitment but could benefit from more personalized support.`
      ],
      lowEngagement: [
        `${student.name} from ${student.country} needs attention. Only ${student.loginCount30Days} logins this month and ${student.daysSinceLastLogin} days since last activity. High risk of dropping off.`,
        `${student.grade}th grader showing minimal engagement. Last active ${student.daysSinceLastLogin} days ago. Immediate intervention recommended to re-engage.`,
        `At-risk student in ${student.applicationStatus.toLowerCase()} stage. Low activity with only ${student.aiQuestionsAsked} questions asked. Requires urgent outreach.`
      ]
    };

    let category = 'lowEngagement';
    if (engagementLevel > 70) category = 'highEngagement';
    else if (engagementLevel > 40) category = 'mediumEngagement';

    const template = templates[category][Math.floor(Math.random() * templates[category].length)];
    return template;
  }

  /**
   * Extract key insights about student
   */
  extractKeyInsights(student) {
    const insights = [];

    // Academic insights
    if (student.gpa && student.gpa > 3.7) {
      insights.push({ type: 'academic', text: 'Strong academic performance', icon: '📚', priority: 'medium' });
    }

    // Engagement insights
    if (student.aiQuestionsAsked > 15) {
      insights.push({ type: 'engagement', text: 'Highly curious - asks detailed questions', icon: '🤔', priority: 'high' });
    }

    // Geographic insights
    if (student.country === 'India' && student.interestedMajors?.includes('Engineering')) {
      insights.push({ type: 'demographic', text: 'Part of high-volume India engineering segment', icon: '🇮🇳', priority: 'medium' });
    }

    // Timing insights
    if (student.daysInCurrentStage > 21) {
      insights.push({ type: 'timing', text: 'Stagnant in current stage - needs push', icon: '⏰', priority: 'high' });
    }

    // Financial insights
    if (student.aiQuestionsAsked && student.questionsAsked?.some(q => q.toLowerCase().includes('financial'))) {
      insights.push({ type: 'financial', text: 'Has concerns about college financing', icon: '💰', priority: 'high' });
    }

    return insights.slice(0, 3); // Return top 3 insights
  }

  /**
   * Get urgency flags for immediate attention
   */
  getUrgencyFlags(student) {
    const flags = [];

    if (student.daysSinceLastLogin > 14) {
      flags.push({ type: 'inactive', message: 'No activity for 2+ weeks', level: 'high' });
    }

    if (student.daysInCurrentStage > 28) {
      flags.push({ type: 'stagnant', message: 'Stuck in current stage for 4+ weeks', level: 'medium' });
    }

    if (student.applicationStatus === 'Applying' && student.documentsUploaded === 0) {
      flags.push({ type: 'missing_docs', message: 'In applying stage but no documents uploaded', level: 'high' });
    }

    if (student.communicationResponseRate < 0.3) {
      flags.push({ type: 'unresponsive', message: 'Low response rate to communications', level: 'medium' });
    }

    return flags;
  }

  // ================== RECOMMENDATIONS ==================

  /**
   * Get next best action for a student
   */
  getNextBestAction(student) {
    const riskScore = this.calculateRiskScore(student);
    const engagementLevel = this.calculateEngagementLevel(student);

    // High risk students
    if (riskScore > 60) {
      if (student.daysSinceLastLogin > 14) {
        return {
          action: 'urgent_reengagement',
          title: 'Urgent Re-engagement Call',
          description: `Call ${student.name} immediately. They haven't logged in for ${student.daysSinceLastLogin} days.`,
          priority: 'high',
          timeframe: 'Today',
          type: 'call'
        };
      }
    }

    // Based on application status
    switch (student.applicationStatus) {
      case 'Exploring':
        if (student.aiQuestionsAsked < 3) {
          return {
            action: 'guided_exploration',
            title: 'Send Exploration Guide',
            description: 'Share personalized major exploration resources and schedule discovery call.',
            priority: 'medium',
            timeframe: '2-3 days',
            type: 'email'
          };
        }
        break;

      case 'Shortlisting':
        if (!student.universityShortlist || student.universityShortlist.length < 5) {
          return {
            action: 'shortlist_assistance',
            title: 'University Shortlisting Support',
            description: 'Provide personalized university recommendations and shortlisting workshop.',
            priority: 'high',
            timeframe: '1-2 days',
            type: 'email'
          };
        }
        break;

      case 'Applying':
        if (student.documentsUploaded === 0) {
          return {
            action: 'document_support',
            title: 'Document Upload Assistance',
            description: 'Guide through document requirements and provide upload support.',
            priority: 'high',
            timeframe: 'Today',
            type: 'call'
          };
        }
        break;

      case 'Submitted':
        return {
          action: 'status_check',
          title: 'Application Status Follow-up',
          description: 'Check in on application status and provide next steps guidance.',
          priority: 'low',
          timeframe: '1 week',
          type: 'email'
        };
    }

    // Default action based on engagement
    if (engagementLevel > 70) {
      return {
        action: 'maintain_momentum',
        title: 'Maintain Momentum',
        description: 'Student is engaged. Send encouraging update and additional resources.',
        priority: 'low',
        timeframe: '3-5 days',
        type: 'email'
      };
    } else {
      return {
        action: 'boost_engagement',
        title: 'Boost Engagement',
        description: 'Send personalized content to increase platform engagement.',
        priority: 'medium',
        timeframe: '1-2 days',
        type: 'email'
      };
    }
  }

  /**
   * Generate communication suggestions
   */
  generateCommunicationSuggestions(student) {
    const suggestions = [];
    
    // Personalization tokens
    const personalTokens = {
      name: student.name,
      country: student.country,
      major: student.interestedMajors?.[0] || 'your intended major',
      stage: student.applicationStatus.toLowerCase()
    };

    if (student.daysSinceLastLogin > 7) {
      suggestions.push({
        type: 'reengagement',
        subject: `${personalTokens.name}, we miss you! Let's get back on track 🚀`,
        preview: `Hi ${personalTokens.name}, I noticed you haven't been active lately. As someone interested in ${personalTokens.major}, I have some exciting updates to share...`,
        tone: 'friendly',
        urgency: 'medium'
      });
    }

    if (student.applicationStatus === 'Shortlisting' && student.aiQuestionsAsked > 5) {
      suggestions.push({
        type: 'progress_support',
        subject: `Ready for the next step in your ${personalTokens.major} journey?`,
        preview: `${personalTokens.name}, you've been asking great questions about ${personalTokens.major}. I think you're ready to start building your university shortlist...`,
        tone: 'encouraging',
        urgency: 'low'
      });
    }

    return suggestions;
  }

  // ================== ANALYTICS & INSIGHTS ==================

  /**
   * Analyze trends across all students
   */
  analyzeTrends(students) {
    const trends = {
      engagement: this.analyzeEngagementTrends(students),
      geographic: this.analyzeGeographicTrends(students),
      academic: this.analyzeAcademicTrends(students),
      timing: this.analyzeTimingTrends(students)
    };

    return {
      ...trends,
      keyInsights: this.generateTrendInsights(trends),
      recommendations: this.generateTrendRecommendations(trends)
    };
  }

  analyzeEngagementTrends(students) {
    const engaged = students.filter(s => this.calculateEngagementLevel(s) > 60).length;
    const atRisk = students.filter(s => this.calculateRiskScore(s) > 50).length;
    
    return {
      engagedStudents: engaged,
      atRiskStudents: atRisk,
      engagementRate: (engaged / students.length * 100).toFixed(1)
    };
  }

  analyzeGeographicTrends(students) {
    const countries = {};
    students.forEach(student => {
      countries[student.country] = (countries[student.country] || 0) + 1;
    });

    return Object.entries(countries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));
  }

  analyzeAcademicTrends(students) {
    const majors = {};
    students.forEach(student => {
      if (student.interestedMajors) {
        student.interestedMajors.forEach(major => {
          majors[major] = (majors[major] || 0) + 1;
        });
      }
    });

    return Object.entries(majors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([major, count]) => ({ major, count }));
  }

  analyzeTimingTrends(students) {
    const stages = {};
    students.forEach(student => {
      stages[student.applicationStatus] = (stages[student.applicationStatus] || 0) + 1;
    });

    return stages;
  }

  generateTrendInsights(trends) {
    const insights = [];

    if (trends.engagement.atRiskStudents > trends.engagement.engagedStudents * 0.3) {
      insights.push({
        type: 'warning',
        title: 'High At-Risk Population',
        message: `${trends.engagement.atRiskStudents} students are at risk of dropping off. Consider launching a re-engagement campaign.`
      });
    }

    if (trends.geographic[0]?.count > trends.geographic[1]?.count * 2) {
      insights.push({
        type: 'opportunity',
        title: 'Geographic Concentration',
        message: `${trends.geographic[0].country} represents a large portion of students. Consider localized content and support.`
      });
    }

    return insights;
  }

  generateTrendRecommendations(trends) {
    const recommendations = [];

    recommendations.push({
      title: 'Weekly At-Risk Review',
      description: 'Implement weekly review of at-risk students for proactive intervention.',
      priority: 'high',
      impact: 'Reduce dropout rate by 25%'
    });

    recommendations.push({
      title: 'Geographic Content Strategy',
      description: `Create region-specific content for top markets: ${trends.geographic.slice(0, 3).map(g => g.country).join(', ')}.`,
      priority: 'medium',
      impact: 'Increase engagement by 15%'
    });

    return recommendations;
  }

  // ================== UTILITY FUNCTIONS ==================

  /**
   * Generate smart filters based on AI insights
   */
  getSmartFilters(students) {
    return {
      'high-intent': students.filter(s => this.analyzeIntent(s) === 'High').length,
      'needs-attention': students.filter(s => this.calculateRiskScore(s) > 50).length,
      'ready-to-apply': students.filter(s => 
        s.applicationStatus === 'Shortlisting' && 
        this.calculateEngagementLevel(s) > 60 && 
        s.documentsUploaded > 0
      ).length,
      'essay-help': students.filter(s => 
        s.aiQuestionsAsked && 
        s.questionsAsked?.some(q => q.toLowerCase().includes('essay'))
      ).length,
      'financial-concerns': students.filter(s => 
        s.questionsAsked?.some(q => 
          q.toLowerCase().includes('financial') || 
          q.toLowerCase().includes('scholarship') ||
          q.toLowerCase().includes('aid')
        )
      ).length
    };
  }

  /**
   * Search students with natural language
   */
  smartSearch(students, query) {
    const searchTerms = query.toLowerCase().split(' ');
    
    return students.filter(student => {
      const searchText = `
        ${student.name} 
        ${student.country} 
        ${student.applicationStatus} 
        ${student.interestedMajors?.join(' ') || ''}
        ${this.analyzeIntent(student)}
      `.toLowerCase();

      return searchTerms.some(term => searchText.includes(term));
    });
  }
}

// Export the AI Engine
const aiEngine = new AIEngine();
export default aiEngine;

// Export individual functions for modular use
export {
  AIEngine
};