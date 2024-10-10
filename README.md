# Slicely: PDF Made Easy

Slicely is a web application that allows you to upload PDF documents and process them using a variety of rules. It is built with Next.js, Supabase, and Tailwind CSS.

## Features

- Upload PDF documents
- Process PDF documents as per your custom instructions and rules
- Bulk processing of PDF documents
- Webhook integration
- Auto detect data from uploaded PDF documents

## Dashboard

The dashboard page displays LLM outputs for all slicers associated with the current user. Each slicer's outputs are shown in a separate card, allowing users to quickly view and compare results across different slicers.

### Features

- Displays LLM outputs for all user's slicers
- Organizes outputs by slicer in separate cards
- Shows formatted responses (single value, chart, table, or text)
- Allows viewing raw responses for each output
- Implements responsive design for various screen sizes
- Provides quick access to each slicer's explore page

### Implementation Details

- Uses server-side rendering with Next.js 14 App Router
- Fetches data using a server action (`getAllSlicersLLMOutput`)
- Implements error handling and loading states
- Uses reusable components for rendering different types of LLM outputs
- Utilizes full viewport height for slicer outputs with vertical scrolling

## Technologies

- Next.js
- Supabase
- Tailwind CSS
- Supabase Storage