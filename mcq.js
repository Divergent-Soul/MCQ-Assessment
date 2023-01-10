import { LightningElement, wire } from 'lwc';
import getAllItems from '@salesforce/apex/mcqApexControllerFroLWC.getAllItems';
import getAnswers from '@salesforce/apex/mcqApexControllerFroLWC.getAnswers';

export default class Mcq extends LightningElement {

    allData = [];
    allResultData;
    filteredData;
    serial = [];
    pageNumber = 1;
    qpp = 5;
    maxPage;
    showSubmit = false;
    showResult = false;
    qusCount;
    scrollOptions = {
        left: 0,
        top: 0,
        behavior: 'smooth'
    };
    answers = [];
    resultData = [];
    percent;
    result;
    notAns;
    showCongrats;
    wrongAns = [];
    wrong=0;

    @wire(getAllItems)
    wiredAccount({ error, data }) {
        if (data) {
            this.allData = [...data];
            this.qusCount = this.allData.length;
            this.addSerial();
        }
        else if (error) {
            alert('Error fetching metadata records in wire method');
        }
    }

    addSerial(){
        let temp = [];
        let index = 1;
        this.allData.forEach(element => {
            temp.push({...element, serial: index});
            index++;
        });
        /*
        this.allData = [];
        this.allData = [...temp];
        */
        // Alternate
        this.allData = temp;    // This will overwrite the existing data
        this.getData();
    }

    getData() {
        if (this.allData.length>0) {
            let temp = [];
            let loopLimit = parseInt(this.pageNumber)*this.qpp;
            let startNum = loopLimit-this.qpp;
            this.maxPage = Math.ceil(this.allData.length/this.qpp);
            this.showSubMethod();
            if(this.allData.length>this.qpp){
                for (let index = startNum; index < loopLimit; index++) {
                    if(this.allData[index] == undefined)
                        break;
                    else
                        temp.push(this.allData[index]);
                }
            }
            else{
                this.allData.forEach(element => {
                    temp.push(element);
                });
            }
            this.filteredData = temp;

            this.timeoutId = setTimeout(this.checkboxRetain.bind(this), 50);
        }
        else {
            alert('No records available!');
        }
    }

    handlePageNavigation(event) {
        if((event.target.name == 'previous' && this.pageNumber == 1) || event.target.name == 'next' && this.pageNumber == this.maxPage){
            alert('No page found!');
            this.showSubMethod();
        }
        else if(event.target.name == 'previous'){
            this.pageNumber--;
            this.getData();
            this.showSubMethod();
        }
        else if(event.target.name == 'next'){
            this.pageNumber++;
            this.getData();
            window.scrollTo(this.scrollOptions);
            this.showSubMethod();
        }      
    }

    showSubMethod(){
        if(this.pageNumber == this.maxPage)
            this.showSubmit = true;
        else
            this.showSubmit = false;
    }

    qppHandleChange(event){
        this.qpp = event.target.value;
        this.pageNumber = 1;
        this.getData();
    }

    onSubmit(){        
        getAnswers()
            .then(result => {
                this.resultData = result;
                let mark = 0;
                let notAnswered = 0;
                this.wrongAns = [...this.answers];
                result.forEach(element => {
                    element.mcqanswers__r.forEach(ans => {
                        let index=(this.wrongAns.findIndex(obj => obj.ans == ans.Label));
                        if(index >= 0){
                            this.wrongAns.splice(index,1);
                        }
                    });
                    if (JSON.stringify(this.answers).includes(element.Label)) {
                        if (element.mcqanswers__r.length == (this.answers.filter(item => item.qus == element.Label)).length) {
                            if(element.mcqanswers__r.length > 1){
                                let count = 0;
                                element.mcqanswers__r.forEach(multi => {
                                    if(JSON.stringify(this.answers).toLowerCase().includes(multi.Label))
                                        count++;
                                });
                                if(element.mcqanswers__r.length == count)
                                    mark++;
                                else
                                    this.wrong++;
                            }
                            else{
                                if(JSON.stringify(this.answers).toLowerCase().includes(element.mcqanswers__r[0].Label))
                                    mark++;
                                else
                                    this.wrong++;
                            }    
                        }
                        else {
                            this.wrong++;
                        }
                    }
                    else{
                        notAnswered++;
                    }
                });
                console.log('WrongAns --> '+JSON.stringify(this.wrongAns));
                console.log('WrongAns Len -->'+ this.wrongAns.length);
                console.log('Wrong-->'+ this.wrong);
                this.totalQus = result.length;
                this.notAns = notAnswered;
                this.percent = ((mark/result.length)*100).toFixed(2);
                if(this.percent>65) {
                    this.result = 'CLEARED';
                    this.showCongrats = true;
                }
                else {
                    this.result = 'NOT CLEARED';
                    this.showCongrats = false;
                }
                this.allResultData = this.allData;
                this.showResult = true;
                this.timeoutId1 = setTimeout(this.checkboxRetainForResult.bind(this), 50);
            })
            .catch(error => {
                alert('Error fetching data from apex for result evaluation: '+error);
            })
    }

    handleOnchange(event){
        let index=(this.answers.findIndex(obj => obj.ans == event.target.value));
        if(index >= 0){
            this.answers.splice(index,1);
            if(event.target.checked){
                this.answers.push({qus:event.target.name, ans:event.target.value, check:event.target.checked, opt:event.target.label}); 
            }
        }
        else
            this.answers.push({qus:event.target.name, ans:event.target.value, check:event.target.checked, opt:event.target.label}); 
    }
    
    checkboxRetain(){
        const chkbxs = this.template.querySelectorAll('lightning-input');
        const tempAns = JSON.stringify(this.answers);
        chkbxs.forEach(element => {
            if(tempAns.toLowerCase().includes((element.value).toLowerCase()))
                element.checked = true;
        });
        clearTimeout(this.timeoutId);
    }

    checkboxRetainForResult(){
        const chkbxs = this.template.querySelectorAll('lightning-input');
        const tempAns = JSON.stringify(this.resultData);
        const tempWrong = JSON.stringify(this.wrongAns);
        chkbxs.forEach(element => {
            if(tempAns.toLowerCase().includes((element.value).toLowerCase())){
                element.checked = true;
                element.parentElement.style = "padding: 1%; background-color:rgba(0, 204, 26, 0.65); border-radius:5px; margin-top: 1px; margin-bottom:1px";
            }
            if(tempWrong.toLowerCase().includes((element.value).toLowerCase())){
                element.parentElement.style = "padding: 1%; background-color:rgba(255, 0, 0, 0.48); border-radius:5px; margin-top: 1px; margin-bottom:1px";
            }
        });
        clearTimeout(this.timeoutId1);
    }

}