public with sharing class mcqApexControllerFroLWC {

    @AuraEnabled(Cacheable=true)
    public static List<mcqquestion__mdt> getAllItems(){
        return [SELECT Id, Label, question__c, serial__c, (SELECT Id, Label, mcqquestion__c, Option__c FROM mcqanswers__r) FROM mcqquestion__mdt ORDER BY serial__c ASC];
    }

    @AuraEnabled
    public static List<mcqquestion__mdt> getAnswers(){
        return [SELECT Id, Label, question__c, serial__c, (SELECT Id, Label, mcqquestion__c, Option__c, Correct_Answer__c FROM mcqanswers__r WHERE Correct_Answer__c = TRUE) FROM mcqquestion__mdt ORDER BY serial__c ASC];
    }

}