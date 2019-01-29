#include "squeakr.hpp"


ACTION squeakr::post(const name user, const std::string secret, const std::string nonce) {
  require_auth(user);
  
  squeaks.emplace(user, [&](auto& x) {
    x.id = squeaks.available_primary_key();
    x.user = user;
    x.secret = secret;
    x.nonce = nonce;
    x.timestamp = now();
  });
}

ACTION squeakr::followreq(const name follower, const name followee) {
  require_auth(follower);
  
  const auto idx = requests.template get_index<"combined"_n>();
  const auto itr = idx.find(combine_ids(follower.value, followee.value));
  check(itr == idx.end(), "You already requested to follow this user");
  
  const auto followers_idx = followers.template get_index<"combined"_n>();
  const auto followers_itr = followers_idx.find(combine_ids(follower.value, followee.value));
  check(followers_itr == followers_idx.end(), "You are already following this user");
  
  requests.emplace(follower, [&](auto& x){
    x.id = requests.available_primary_key();
    x.follower = follower;
    x.followee = followee;
  });  
}

ACTION squeakr::accept(const name followee, const name follower) {
  require_auth(followee);
  
  const auto idx = requests.template get_index<"combined"_n>();
  const auto itr = idx.find(combine_ids(follower.value, followee.value));
  check(itr != idx.end(), "Follow request not found");
  
  const auto followers_idx = followers.template get_index<"combined"_n>();
  const auto followers_itr = followers_idx.find(combine_ids(follower.value, followee.value));
  check(followers_itr == followers_idx.end(), "You are already following this user");
  
  followers.emplace(followee, [&](auto& x) {
    x.id = followers.available_primary_key();
    x.follower = follower;
    x.followee = followee;
  });
  
  requests.erase(requests.find(itr->id));
}

EOSIO_DISPATCH(squeakr, 
  (followreq)
  (post) 
  (accept)
)