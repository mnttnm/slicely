## Tasks:
- [ ] Prepare a demo script
- [ ] Store the llm processed output in the db
- [ ] Bulk process all the files of a slicer
- [ ] Chat with whole pdf (Default slicer implementation)
- [ ] Populate dashboard with meaningful info
 - we can allow users to define llm prompts for their dashboard,
   it will run on all the data or the slicer output linked by the users.
- [ ] Create default slicer rule and generate output from the pdf based on it
- [ ] Pagination and search for pdf files (the files tab in the studio)

- [Done] Show referenced documents along with the llm output
- [Done] Breadcrumbs
 - [Done] A new tab in slicer to show all the data from the pdfs linked to the slicer
      - Allow users to search the data
      - Allow users to chat with the data
      - results will be shown in a list with the pdf name and the page number (source)
      - define data processing rules/prompts for the slicer data
 - [Done] If a pdf has been processed, then show the output while viewing the pdf
- [Done] PDF chat support using Claude or GPT-4o
- [] They will also define the output format
- [Done] Search page to search across multiple pdfs or entire documents
- [Done] User should be able to assign pdf processing template to pdf or multiple pdfs or folder, all
      pdfs in a folder should be processed using the same template
- [Done] Supabase project init
- [Done] Auth using supabase-ssr package, Google OAuth as well
- [Done] Ability to store pdf, associated metadata and text in db
- [Done] Open pdf in studio mode
- [Done] In studio mode, user should be able select the sections to be excluded or included while extracting text
- [Done] Allow users to skip a page while extracting text or while chatting
- [Done] Store the annotations and the processing rules in the db for slicer, read it on the slicer settings page.
- [Done] Improve the layout of the slicer details page so that it has linked files |  studio


## Notes:
 The data/explore tab will have its own rules to process the data.
 User can create a custom dashboard, track variables etc.
 

