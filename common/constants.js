module.exports = {
    MESSAGE: {
        STORE: {
            MAX_LIMIT_REACHED: "You have reached max limit for adding Porducts. Purchase more limit.",
            STORE_PASS_INVALID: "You Have Provided Invalid Store Pass",
            STORE_PASS_ALREADY_USED: "The Store Pass Provided By You is Already Used",
            NOT_ALLOWED_TO_REDEEM_BOTH: "You can either use Store Pass or Store Subscription.",
            LISTING_REQUEST_ALREADY_EXIST: "You have already sent a request. Please wait for the Response.",
            NOT_FOUND: "Store not found"

        },
        USER: {
            EMAIL_ALREADY_IN_USE: 'This Email address is already been taken',
            USERNAME_ALREADY_IN_USE: 'This Username is already in use',
            EMAIL_VERIFICATION_REQUIRED: false,
            NOT_FOUND: 'User not Found ',
            SELLER_NOT_FOUND: 'Seller not Found ',
            VERIFY_EMAIL: "Your email is not verified",
            NOT_VERIFIED: "Email is Not verified",
            OTP_SENT: 'An OTP is sent to your registered email address',
            TWO_FA_OTP_SENT:'An Two-factor authentication Code is sent to your registered email address',
            OTP_INVALID: 'You have provided Wrong OTP',
            PASSWORD_RESET_SUCCESS: "Password reset Successfully",
            UPLOAD_SUCCESS: "file uploaded successfully.",
            UPLOADING_ERROR: "Unable to process file",
            LOGIN_SUCCESS: "User Logged in Successfully",
            LOGOUT_SUCCESS : "User Logged out Successfully",
            ADDRESS_NOT_FOUND: "Shipping Address is not Added. Please Add",
            DEFAULT_ADDRESS_NOT_FOUND: "No Default Address found.",
            ALLOW_WITHOUT_EMAIL_VERIFICATION: true,
            OTP_VALID: "OTP is Validated",
            STATUS: {
                BlOCK_USER: "You Blocked the User",
                UNBLOCK_USER: "You Unblocked the User",
            },
            DEFAULT_ADRESS_NOT_SET: "No default Address Found",
            NO_CARD_FOUND: "No default payment method found",
            REVIEW: {
                ALREADY_REVIEWED: "You Have Already Reviewed this User."
            },
            FOLLOWED: "Followed successfully",
            UNFOLLOWED: "un-followed successfully"
        },
        STRIPE: {
            ACCOUNT_NOT_FOUND: "Stripe Account is not set please  update first"
        },
        CATEGORY: {
            CREATED: "Category created successfully",
            ALREADY_EXIST: "Category with this name already exist",
            UPDATED: "Category updated successfully",
            NOT_FOUND: "Category not found"
        },
        BRAND: {
            CREATED: "Brand created successfully",
            ALREADY_EXIST: "Brand with this name already exist",
            UPDATED: "Brand updated successfully",
            NOT_FOUND: "Brand not found"
        },
        SUBSCRIPTION_PLAN: {
            NOT_EXIST: "The Subscription Plan Not found or belongs to you.",
            DELETED: "Subscription Plan Deleted Successfully.",
            ALREADY_SUBSCRIBER: "You have already subscribed this plan.",
            NOT_FOUND: "Subscription Plan Does not Exist.",
            NOT_SUBSCRIBED: "You have Not Subscribed to any Plan.",
            CANCELLED: "Your subscription has been canceled successfully.."
        },
        PRODUCT: {
            CREATED: "Product created successfully",
            ALREADY_EXIST: "Product with this name already exist",
            UPDATED: "Product updated successfully",
            NOT_FOUND: "Product not found",
            ADDED_RECOMMENDED : "Added to Recommended Products",
            REMOVED_RECOMMENDED : "Removed from Recommended Products",
            TYPE: {
                FOR_MARKET_PLACE: "forMarketplace",
                FOR_AUCTION: "forAuction",
                FOR_LIVE_STREAM: "forLiveStream"
            },
            REVIEW: {
                CREATED: "Review Added Successfully.",
                ALREADY_REVIEWED: "You have already rated the product"
            },
            LIKED: 'You liked The Product',
            UNLIKED: 'You Un-liked The Product',

            VARIANT_NOT_AVAILABLE: 'The Selected Vairent is not Avilable',
            ITEM_OUT_OF_STOCK: 'The Selected Item is Out Of Stock',
            ITEM_NOT_FOUND: 'The Selected Item is Not Found',
            ALREADY_IN_CART: 'Selected Product is Already in the Cart',
            ALREADY_OFFERED: 'You have already Offered on this product. You are not allowed to create a new offer.',
            STATUS_ALREADY_CHANGED : "You can not proceed further. Because you have already Approved or rejected this order."

        },
        WATCHLIST: {
            ADDED: "Product Added To your Watchlist",
            REMOVED: "Product Removed From Your Watchlist",
        },
        STORY: {
            CREATED: "Story Posted Successfully.",
            DELETED: "Story Deleted Successfully",
            PINNED : "Story Pinned Successfully",
            UNPINNED : "Story Un-pinned Successfully",
        },
        ORDER: {
            NOT_FOUND: "Order Not Found",
            ALREADY_REPORTED : "Sorry! You cannot proceed further because you have already reported this order.",
            ALREADY_CANCELLED : "Sorry! You cannot proceed further because you have already cancelled this order.",
            DISPUTE_REASONS: {
                ITEM_MISMATCHED: "The item I received was not what was shown.",
                ITEM_DAMAGED: "Item arrived damaged.",
                ITEM_NOT_RECIEVED: "I never received my item.",
                CANCEL_ORDER: "I need to cancel the order.",
                RETURN_ITEM: "I need to return this item",
                OTHER: "Other - Describe in detail:"
            }
        },
        NOTIFICATIONS: {
            NEW_CONNECTION_REQUEST: 'NEW_CONNECTION_REQUEST', //
            CONNECTION_REQUEST_ACCEPTED: 'CONNECTION_REQUEST_ACCEPTED', //
            NEW_LIKE_ON_POST: 'NEW_LIKE_ON_POST', //
            NEW_COMMENT_ON_POST: 'NEW_COMMENT_ON_POST',   //
            NEW_LIKE_ON_COMMENT: 'NEW_LIKE_ON_COMMENT', //
            NEW_LIVE_STREAM: 'NEW_LIVE_STREAM',
            NEW_MESSAGE: 'NEW_MESSAGE',
            NEW_STORY_ADDED: 'NEW_STORY_ADDED',
            INCOMING_CALL: 'INCOMING_CALL',
            CANCEL_CALL: 'CANCEL_CALL',
            ACCEPT_CALL: 'ACCEPT_CALL',
            REJECT_CALL: 'REJECT_CALL',
            CALL_ENDED: "CALL_ENDED",
            NEW_LIVE_STREAM: "NEW_LIVE_STREAM",
            LIVE_STREAM_ENDED: "LIVE_STREAM_ENDED",
            LIVE_STREAM_JOINED: "LIVE_STREAM_JOINED",
            LIVE_STREAM_LEAVE: "LIVE_STREAM_LEAVE",
        },

        RECORD_CREATED: "New User Created Successfully.",
        DATA_SAVED: "Data Saved Successfully.",
        NOT_FOUND: 'Not Found',
        EMAIL_MISSING: 'Please provide email address',
        SUCCESS: 'Success',
        LIST:"Data Fetched Successfully."
    },
    SHIPPING: {
        PACKAGE_TYPES: {
            CARDBOARD: 'Cardboard/Fiberboard',
            BAGGED_CARGO: 'Bagged Cargo',
            WOODEN_CASES: 'Wooden Cases',
            WOODEN_CRATES: 'Wooden Crates',
            BALES: 'Bales',
            PALLETIZING_CARGO: 'Palletizing Cargo',
            CONTAINERS: 'Containers',
            OTHERS: 'Others'
        },
        TYPE: {
            FREE: 'free',
            PAID: 'paid'
        }
    },
    DEFAULTS: {
        CURRENCY: "usd",
    },
    STREAM: {
        NOT_FOUND: 'Stream not found.',
        ENDED: "This Stream is not Available or ended.",
        STATUS: {
            LIVE: 'Live',
            ENDED: 'Ended',
            NOT_STARTED: 'Not-Started'
        }
    },
    FCM:{
        SERVER_KEY : "AAAAQPkrqEk:APA91bFnnCypdOb58a8JyVcadfrfAdWGirM7XpGjtgarSE7RAPClRCTWT3pute8coryCeNfWoD0boL8pYjtBQgpihiopZtGqT1Fd3cPPl4ul_MNQlhh87LLKOb4NB560Y0PC6gReP265",
        URL : "https://fcm.googleapis.com/fcm/send",
        TYPES : {
            LOW_QUANTITY : "LOW_QUANTITY",
            SOLD_OUT : "SOLD_OUT",
            PRICE_DROPPED : "PRICE_DROPPED",
            ORDER_REPORTED_BY_USER : "ORDER_REPORTED",
            USER_FOLLOWED: "USER_FOLLOWED",
            USER_LIKED: "USER_LIIKED",
            ITEM_SOLD : "ITEM_SOLD",
            ITEM_OFFERED : "ITEM_OFFERED",
            LISTING_ENDED : "LISTING_ENDED",
            NEW_REVIEW : "NEW_REVIEW",
            USER_FOLLOWED_SCHEDULED_LIVE_STREAM : "USER_FOLLOWED_SCHEDULED_LIVE_STREAM",
            LISTING_POSTED : "LISTING_POSTED",
            NEW_MESSAGE : "NEW_MESSAGE",
            STREAM_GOING_LIVE : "STREAM_GOING_LIVE",
            OUT_OF_STOCK : "OUT_OF_STOCK"
        },
        MESSAGES: {
            LOW_QUANTITY : "Only Few stocks Left ! Please check your watchlist",
            SOLD_OUT : "The item has been sold out from your watchlist.",
            PRICE_DROPPED : " has dropped in price.",
            ORDER_REPORTED_BY_USER :"A problem with a purchase. Can’t opt out since this is vital.",
            USER_FOLLOWED: "New Followers",
            USER_LIKED: "liked your listing.",
            ITEM_SOLD_MESSAGE1 : ` purchased your item `,
            ITEM_SOLD_MESSAGE2 : ` Check your notifications tab for more info.`,
            ITEM_OFFERED : " made an offer on your listing.",
            LISTING_ENDED_MESSAGE1 : "Your listing for ",
            LISTING_ENDED_MESSAGE2 : " has ended. Relist your item at no extra cost!",
            NEW_REVIEW_MESSAGE1 : "You have received a ",
            NEW_REVIEW_MESSAGE2 : " star review",
            NEW_REVIEW_MESSAGE3 : " with some feedback:",
            USER_FOLLOWED_SCHEDULED_LIVE_STREAM_MESSAGE1 : " is hosting a live-stream on: ",
            USER_FOLLOWED_SCHEDULED_LIVE_STREAM_MESSAGE2 : ". Be sure to tune in and support your host!",
            LISTING_POSTED : " item newly added.",
            NEW_MESSAGE1 : "You have ",
            NEW_MESSAGE2 : " new message(s)",
            STREAM_GOING_LIVE : " is starting, click here to join!",
            OUT_OF_STOCK : "The item is out of stock"
        },
        TITLE : {
            ITEM_OFFERED : "Offer made onto a listing.",
            LISTING_ENDED : "Listing Ended",
            NEW_REVIEW : "New Review",
            USER_FOLLOWED_SCHEDULED_LIVE_STREAM : "User followed has scheduled a live-stream: (Following Going Live)",
            NEW_MESSAGE : "New Message.",
            STREAM_GOING_LIVE : "Live-Auction Going Live ",
            OUT_OF_STOCK : "Item out of stock",
            LISTING_POSTED : "  item newly added."

        }
    },
    SUPPORT:{
        EMAIL : "littSupport@yopmail.com"
    },
    SHIPPO: {
        UNITS : {
            DISTANCE: "cm",
            MASS: "lb"
        }
    },
    IAP:{
        APPLE_PASSWORD: "f84d3585f2e24cef9870f6ed75f04b27"
    }

}