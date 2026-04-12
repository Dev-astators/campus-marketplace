//checking if the user enters a valid email upon sign in

const Wits_domain = 'students.wits.ac.za';

// This function validates the email of the user & it should be a valid Wits email
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

//getRoleRedirect-> Returns the correct route based on the role read for profiles
const getRoleRedirect = (role) =>{
    const redirectMap= {
        student: '/student-dashboard',
        facility_staff: '/facility-dashboard',
        admin: '/admin-dashboard'
    };

    //return the route.
    return redirectMap[role] || null;
};
module.exports = {validateUniversityEmail, getRoleRedirect};