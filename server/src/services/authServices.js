//checking if the user enters a valid email upon sign in

const Wits_domain = 'students.wits.ac.za';

const validateUniversityEmail = (email) =>{

    if (!email || typeof email !== 'string'){
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;//to verify if the string roughly looks like an email
    if (!emailRegex.test(email)){ //if the email pattern does not match
        return false;
    }

    const domain = email.split('@')[1].toLocaleLowerCase();//extract the part folloeing the @ symbol

    return Wits_domain.includes(domain);
};

module.exports = {validateUniversityEmail};