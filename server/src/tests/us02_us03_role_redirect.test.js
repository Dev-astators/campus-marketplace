const {getRoleRedirect} = require('../../src/services/authServices');

//testing for user story 2 and 3 

describe("User story 2 & user story 3 - Role-based dashboard redirect", ()=>{

    describe("User story 2 - Admin redirect", ()=>{
        test("Given a signed-in user with role admin, when auth completes, then they are redirected to /admin-dashboard", ()=>{
            expect(getRoleRedirect('admin')).toBe('/admin-dashboard');
        });
    });

    describe("User story 3 - facility staff redirect", ()=>{
        test("Given a signed-in user with role facility_staff,when auth completes, then they are redirected to '/facility-dashboard", ()=>{
            expect(getRoleRedirect('facility_staff')).toBe('/facility-dashboard');
        });
    });

    describe("Student redirect", ()=>{
        test("Given a signed-in student with role student, when auth completes, then they are redirected to /student-dashboard", ()=>{
            expect(getRoleRedirect('student')).toBe('/student-dashboard');
        });
    });

    describe("Edge cases", ()=>{
        test("Given an unrecognised role, when auth completes, then null is returned",()=>{
            expect(getRoleRedirect('unkown')).toBeNull();
        });

        test("Given an empty string role, when auth completes, then null is returned", ()=>{
            expect(getRoleRedirect('')).toBeNull();
        });
    });

});