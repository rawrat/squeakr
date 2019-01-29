#include <eosiolib/eosio.hpp>
using namespace eosio;



CONTRACT squeakr : public contract {
   public:
      using contract::contract;
      squeakr(name self, name code, datastream<const char*> ds) : 
      eosio::contract(self,code,ds), 
      squeaks(_self, _self.value), 
      followers(_self, _self.value),
      requests(_self, _self.value)
      {}

      /**
        * Table that stores the encrypted Tweets (Squeaks)
        */
      TABLE squeak {
        uint64_t id;
        name user;
        uint32_t timestamp;
        std::string secret; // The encrypted message text
        std::string nonce;  // Nonce for the encrypted message text
        
        uint64_t primary_key()const { return id; } 
        uint64_t by_user()const { return user.value; }
      };
      typedef multi_index<"squeak"_n, squeak,
        indexed_by< "byuser"_n, const_mem_fun<squeak, uint64_t,  &squeak::by_user> >
      > squeak_table;
      squeak_table squeaks;
      
      
      /**
        * Only approved followers can read the squeaks
        */
      TABLE follower {
        uint64_t id;
        name follower;
        name followee;
        
        uint64_t primary_key()const { return id; } 
        uint64_t by_follower()const { return follower.value; }
        uint64_t by_followee()const { return followee.value; }
        uint128_t combined() const { return combine_ids(follower.value, followee.value); }
      };
      typedef multi_index<"follower"_n, follower,
        indexed_by< "byfollower"_n, const_mem_fun<follower, uint64_t,  &follower::by_follower> >,
        indexed_by< "byfollowee"_n, const_mem_fun<follower, uint64_t,  &follower::by_followee> >,
        indexed_by< "combined"_n, const_mem_fun<follower, uint128_t,  &follower::combined> >
      > follower_table;
      follower_table followers;
      
      /**
        * If someone requests access, we can show these in the UI.
        * Once confirmed, we can create the corresponding entry in the 
        * followers table.
        */
      typedef multi_index<"request"_n, follower,
        indexed_by< "combined"_n, const_mem_fun<follower, uint128_t,  &follower::combined> >
      > request_table;
      request_table requests;
      
      ACTION post(const name user, const std::string secret, const std::string nonce);
      ACTION followreq(const name follower, const name followee);
      ACTION accept(const name followee, const name follower);


    
    private:
      static uint128_t combine_ids(const uint64_t &x, const uint64_t &y) {
          return (uint128_t{x} << 64) | y;
      }

};