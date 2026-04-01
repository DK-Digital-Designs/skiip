into the dashbaord now. 

Onboarding failed: ReferenceError: StripeService is not defined
    at handleConnectStripe (Dashboard.jsx:127:29)
handleConnectStripe	@	Dashboard.jsx:139
<button>		
VendorDashboard	@	Dashboard.jsx:186
<VendorDashboard>		
App	@	App.jsx:51
<App>		
(anonymous)	@	main.jsx:43


creating a new item with the vendor dashbaord (inventory works) a bit janky, but it does work. 

images dont work, get a localhost popup that says bucket not found. 

no way for vendors to leave back to the main app, without logging out. 

i want a more global / standard login system, in the top right of the site at all times, you should be able to see your account, if you logged in, what tag you are( vendor, admin, user etc), and even as admin, you should be able to see the site as normal, with the added benefit of also accessing your user based roles (admin dashbaord) 

sometimes, vendors dont show up, and i have to reset the web page (ctrl, shift, r), and make sure to not log. and then it works, 

sometimes loading is a bit slow. 

