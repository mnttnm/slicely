export interface WelcomeStep {
  title: string;
  items: string[];
}

export interface WelcomeContent {
  title: string;
  description: string;
  steps: WelcomeStep[];
  footer: string;
}

export const welcomeContent: WelcomeContent = {
  title: "👋 Welcome to Slicely!",
  description: "Hey there! We're excited to have you here. Slicely helps you unlock insights from your PDF documents using AI. Start with our demo data, then log in to process your own documents. Here's your quick guide:",
  steps: [
    {
      title: "1. Create Your Slicer",
      items: [
        "Click on \"Create New Slicer\" in the Studio tab",
        "Give your slicer a name and description",
        "Configure your OpenAI API key in settings"
      ]
    },
    {
      title: "2. Define Processing Rules",
      items: [
        "Upload your PDF document",
        "Use rectangle tool to select areas of interest",
        "Add LLM prompts to analyze selected content",
        "Add PDF prompts for page-level analysis"
      ]
    },
    {
      title: "3. Process and Analyze",
      items: [
        "Click \"Process\" to extract and analyze content",
        "View extracted text and AI insights",
        "Use PDF Chat to interact with individual documents",
        "Use Explore tab to search across all processed content"
      ]
    }
  ],
  footer: "Don't worry about your OpenAI API key - we never store it on our servers. It stays secure in your browser."
};