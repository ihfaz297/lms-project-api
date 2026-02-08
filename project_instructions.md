Objectives:  
• To develop API-based websites to simulate the functionalities of LMS system  
services among different entities..   
Submission:   
• Project showcasing.  
Description:  
In this project, you will simulate the functionalities of a learning management system (LMS) 
among different entities. You will need to consider three different entities: the LMS  
organisation, which will host the video and learning contents for the viewers and facilitate 
learning, the instructors can upload their learning materials (text, audio, video, mcq) and the 
learners can take any courses by paying some specified amounts.  
Within this setting, the assumptions for each entities are the following:  
• The LMS system only hosts 5 courses.  
• These courses and corresponding materials are uploaded by the 3 different instructors. 
They will get a lump sum amount whenever they upload any course. 
• A learner can buy any course from the LMS website by paying some fees and after 
completion of the course, they’re awarded with a certificate.  
The flow among these entities will be similar to something like this:  
• A learner (previously registered) logs in to the LMS website. After a successful login, the 
user lands into  the home page.   
• When in the home page for the first time, the user needs to set up his bank  
information (account number) and add a secret which can be used to transact with  
the bank.  
• The user can view and admit into a course from a corresponding page.   
• The user chooses any courses from these 5 courses and decides to buy them.  
• The amount required to buy them is calculated and a transaction request is sent to  the 
bank with other bank information related to the user.   
• Once successful, a message is shown to the user.  
• The LMS organisation interacts with the bank to create a transaction record  that will 
allow the instructor to collect the required money for the course sold from the LMS 
organisation’s account.   
• The instructor validates this transaction record with the bank and once validated, the  
transaction amount is transferred to its account. Once the transaction is done, the 
course is open to the learner. 
• The learner can access the learning materials and upon completion he’s awarded with a 
certificate from the LMS system.   
• The instructor can upload any course or course materials from their profile and the LMS 
will pay some certain amount for the course.   
• There must be a mechanism for these entities – the instructor, the e-commerce 
organisation  and the learner- to get their bank balance. 
Use Nodejs and restAPIs to implement the project.