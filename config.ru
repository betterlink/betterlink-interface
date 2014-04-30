use Rack::Static, 
  :urls => ["/src"],
  :root => "."

web = Proc.new {|env| [200, {'Content-Type' => 'text/html'}, File.open('example_site.html', File::RDONLY)]}

map '/' do
	run web
end
